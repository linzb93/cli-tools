import chalk from 'chalk';
import axios from 'axios';
import { fork } from 'child_process';
import lodash from 'lodash';
import clipboardy from 'clipboardy';
import { reactive } from '@vue/reactivity';
import { watch } from '@vue/runtime-core';
import pMap from 'p-map';
import path from 'path';
import BaseCommand from '../../util/BaseCommand.js';
import set from './set.js';
import { AnyObject } from '../../util/types';

interface Options {
  force: boolean;
  debug: boolean;
  single: boolean | string;
  update: boolean;
}

interface ProjectList {
  items: {
    prefix: string;
    id: string;
    name: string;
  }[];
}

type FetchList = {
  list: {
    path: string;
    title: string;
    // eslint-disable-next-line camelcase
    up_time: string;
    _id: string;
  }[];
}[];

interface ApiList {
  items: {
    path: string;
    title: string;
    updateTime: string;
    id: string;
    json: AnyObject;
  }[];
}

const { flatten } = lodash;
const service = axios.create({
  baseURL: 'http://192.168.0.107:3000/api'
});
service.interceptors.response.use(
  (res) => {
    if (res.data.errcode) {
      return Promise.reject(res.data.errcode);
    }
    return res.data.data;
  },
  (err) => err
);

class Mock extends BaseCommand {
  action: string;
  private cookie: string;
  private options: Options;
  constructor(action: string, options: Options) {
    super();
    this.action = action;
    this.options = options;
    this.cookie = '';
    this.genCooie();
  }
  async run() {
    if (this.action === 'set') {
      set();
      return;
    }
    let db = this.helper.createDB('yapi');
    await db.read();
    let answer = {
      project: '',
      prefix: '',
      id: ''
    };
    if ((db.data as ProjectList).items.length === 0) {
      this.logger.error('没有项目可以选择');
      return;
    }
    if ((db.data as ProjectList).items.length === 1) {
      const target = (db.data as any).items[0];
      answer = {
        ...target,
        project: target.id
      };
    } else {
      answer = (await this.helper.inquirer.prompt({
        message: '请选择项目',
        type: 'list',
        choices: (db.data as ProjectList).items.map((item) => ({
          value: item.id,
          name: `${chalk.yellow(item.name)}: ${chalk.green(item.prefix)}`
        })),
        name: 'project'
      })) as { project: string; id: string; prefix: string };
    }
    if (this.options.debug) {
      await this.createServer(answer);
      return;
    }
    db = this.helper.createDB(`yapi.${answer.project}`);
    await db.read();
    if (this.options.single) {
      let target = '';
      if (typeof this.options.single === 'string') {
        const match = (db.data as ApiList).items.find(
          (item) => item.path === this.options.single
        );
        if (match) {
          target = match.id;
        }
      } else {
        // 更新单一接口
        const answer = await this.helper.inquirer.prompt({
          type: 'list',
          choices: (db.data as ApiList).items.map((item) => ({
            value: item.id,
            name: `${chalk.green(item.title)}: ${chalk.gray(item.path)}`
          })),
          name: 'target',
          message: '请选择要更新的接口'
        });
        target = answer.target;
      }
      const json = await this.update(target);
      const match = (db.data as ApiList).items.find(
        (item) => item.id === target
      );
      if (match) {
        match.json = json;
      }
      await db.write();
      this.logger.success(`接口更新成功`);
      return;
    }
    // 同步api
    const list = await this.getApiList(answer.project);

    const result = flatten(
      list.map((item) => {
        return item.list.map((sub) => ({
          path: sub.path,
          title: sub.title,
          updateTime: sub.up_time,
          id: sub._id
        }));
      })
    );
    const source = (db.data as ApiList).items;
    const counter = reactive({
      add: 0,
      update: 0,
      total: 0
    });
    watch(counter, (data) => {
      this.spinner.text = `已扫描${chalk.cyan(
        data.total
      )}个，其中新增${chalk.green(data.add)}个，更新${chalk.yellow(
        data.update
      )}个`;
    });
    (db.data as ApiList).items = await pMap(
      result,
      async (item: any) => {
        const match = source.find((s) => s.id === item.id);
        counter.total++;
        if (!match) {
          counter.add++;
          return {
            ...item,
            json: await this.update(item.id)
          };
        }
        if (match.updateTime < item.updateTime || this.options.force) {
          counter.update++;
          return {
            ...item,
            json: await this.update(item.id)
          };
        }
        return match;
      },
      { concurrency: 10 }
    );
    await db.write();
    this.spinner.succeed();
    if (this.options.update) {
      return;
    }
    this.logger.info('正在启动服务器...');
    await this.helper.sleep(500);
    await this.createServer(answer);
  }
  private async createServer({ prefix, id }: { prefix: string; id: string }) {
    const child = fork(
      path.resolve(this.helper.root, 'dist/commands/mock/server.js'),
      [`--prefix=${prefix}`, `--id=${id}`],
      {
        cwd: this.helper.root,
        detached: true,
        stdio: [null, null, null, 'ipc']
      }
    );
    child.on('message', async ({ port, ip }: { port: string; ip: string }) => {
      console.log(`代理服务器已在 ${chalk.yellow(port)} 端口启动：
  - 本地：${chalk.magenta(`http://localhost:${port}${prefix}`)}
  - 网络：${chalk.magenta(`http://${ip}:${port}${prefix}`)}
      `);
      child.unref();
      child.disconnect();
      process.exit(0);
    });
  }
  private genCooie() {
    this.cookie = `_yapi_uid=${this.ls.get(
      'mock.uid'
    )}; _yapi_token=${this.ls.get('mock.token')}`;
  }
  private async getApiList(id: string): Promise<FetchList> {
    try {
      return (await service({
        method: 'GET',
        url: `/interface/list_menu`,
        params: {
          // eslint-disable-next-line camelcase
          project_id: id
        },
        headers: {
          Cookie: this.cookie
        }
      })) as any;
    } catch (error) {
      await this.login();
      return await this.getApiList(id);
    }
  }
  private async login() {
    const { is } = await this.helper.inquirer.prompt({
      type: 'confirm',
      name: 'is',
      message: 'token已过期，确认使用剪贴板的内容吗？'
    });
    if (!is) {
      process.exit(0);
    }
    this.ls.set('mock.token', clipboardy.readSync());
    this.genCooie();
  }
  private async update(id: string) {
    const res = (await service({
      method: 'GET',
      url: `/interface/get`,
      params: {
        id: Number(id)
      },
      headers: {
        Cookie: this.cookie
      }
    })) as any;
    if (res.res_body) {
      const responseBody = JSON.parse(res.res_body);
      const p = responseBody.properties;
      if (p.code && p.msg) {
        // 有包裹，去掉包裹内容
        const { result } = responseBody.properties;
        if (result.type === 'null') {
          return null;
        }
        if (result.type === 'number') {
          return {
            root: '@integer(1,100)'
          };
        }
        if (result.type === 'array') {
          if (result.items.type === 'string') {
            return {
              array: ['1', '2', '3']
            };
          }
          return {
            [`array|1-3`]: [render(result.items)]
          };
        }
        return render(result);
      }
      return render(responseBody);
    } else {
      return {};
    }
  }
}

export default (action: string, options: Options) => {
  new Mock(action, options).run();
};

function render(src: any) {
  const ret = {} as any;
  const p = src.properties;
  for (const key in src.properties) {
    if (isProvince(key)) {
      ret[key] = '@province';
    } else if (isArea(key)) {
      ret[key] = '@city';
    } else if (isMobile(key)) {
      ret[key] = '@integer(13000000000,13999999999)'; // 目前没有电话号码的mock
    } else if (isTime(key)) {
      ret[key] = `@date(yyyy-mm-dd HH:mm:ss)`;
    } else if (isId(key)) {
      ret[`${key}|+1`] = 1;
    } else if (isEnum(p[key])) {
      ret[`${key}|1`] = getEnum(p[key]);
    } else if (p[key].type === 'string') {
      ret[key] = '@ctitle(5)';
    } else if (p[key].type === 'number') {
      ret[key] = '@integer(20, 100)';
    } else if (p[key].type === 'boolean') {
      ret[key] = '@boolean';
    } else if (p[key].type === 'object') {
      ret[key] = render(p[key]);
    } else if (p[key].type === 'array') {
      if (!['string', 'number'].includes(p[key].items.type)) {
        ret[`${key}|1-3`] = [render(p[key].items)];
      } else {
        if (p[key].items.type === 'string') {
          ret[key] = ['1', '2', '3'];
        } else {
          ret[key] = [1, 2, 3];
        }
      }
    }
  }
  return ret;
}

function isProvince(key: string) {
  const data = key.toLowerCase();
  return data.endsWith('province');
}

function isArea(key: string) {
  const data = key.toLowerCase();
  return data.endsWith('city') || data.endsWith('area');
}

function isMobile(key: string) {
  const data = key.toLowerCase();
  return data.includes('phone') || data.includes('mobile');
}

function isId(key: string) {
  return key.toLowerCase().endsWith('id');
}

function isTime(key: string) {
  return key.toLowerCase().endsWith('time');
}

function isEnum(object: any): boolean {
  const { description = '' } = object;
  const seg = description.split(' ');
  const numList = seg
    .map((item: string) => {
      const match = /^\d+/.exec(item);
      return match ? Number(match[0]) : null;
    })
    .filter((item: any) => item !== null);
  if (!numList.length) {
    return false;
  }
  for (let i = 1; i < numList.length; i++) {
    if (numList[i] - numList[i - 1] !== 1) {
      return false;
    }
  }
  return true;
}
function getEnum(object: any) {
  const { description = '' } = object;
  const seg = description.split(' ');
  return seg
    .map((item: any) => {
      const match = /^\d+/.exec(item);
      return match ? Number(match[0]) : null;
    })
    .filter((item: any) => item !== null);
}
