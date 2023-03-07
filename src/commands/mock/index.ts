import BaseCommand from '../../util/BaseCommand.js';
import set from './set.js';
import chalk from 'chalk';
import axios from 'axios';
import { fork } from 'child_process';
import lodash from 'lodash';
import clipboardy from 'clipboardy';
import { reactive } from '@vue/reactivity';
import { watch } from '@vue/runtime-core';
import pMap from 'p-map';
import path from 'path';

interface Options {
  force: boolean;
  debug: boolean;
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
    if ((db.data as any).items.length === 0) {
      this.logger.error('没有项目可以选择');
      return;
    }
    if ((db.data as any).items.length === 1) {
      const target = (db.data as any).items[0];
      answer = {
        ...target,
        project: target.id
      };
    } else {
      answer = (await this.helper.inquirer.prompt({
        message: '请选择项目',
        type: 'list',
        choices: (db.data as any).items.map((item: any) => ({
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
    // 同步api
    const list = await this.getApiList(answer.project);
    db = this.helper.createDB(`yapi.${answer.project}`);
    await db.read();
    const result = flatten(
      list.map((item: any) => {
        return item.list.map((sub: any) => ({
          path: sub.path,
          title: sub.title,
          updateTime: sub.up_time,
          id: sub._id
        }));
      })
    );
    const source = (db.data as any).items;
    const counter = reactive({
      add: 0,
      update: 0,
      total: 0
    });
    watch(counter, (data) => {
      this.spinner.text = `已扫描${chalk.green(
        data.total
      )}个，其中新增${chalk.green(data.add)}个，更新${chalk.green(
        data.update
      )}个`;
    });
    (db.data as any).items = await pMap(
      result,
      async (item: any) => {
        const match = source.find((s: any) => s.id === item.id);
        counter.total++;
        if (!match) {
          counter.add++;
          return {
            ...item,
            json: await this.updateMock(item.id)
          };
        }
        if (match.updateTime < item.up_time || this.options.force) {
          counter.update++;
          return {
            ...item,
            json: await this.updateMock(item.id)
          };
        }
        return match;
      },
      { concurrency: 10 }
    );
    await db.write();
    this.spinner.succeed();
    await this.helper.sleep(1500);
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
    child.on(
      'message',
      async ({
        port,
        ip,
        info
      }: {
        port: string;
        ip: string;
        info?: string;
      }) => {
        console.log(`info:${info}`);
        console.log(`代理服务器已在 ${chalk.yellow(port)} 端口启动：
      - 本地：${chalk.magenta(`http://localhost:${port}${prefix}`)}
      - 网络：${chalk.magenta(`http://${ip}:${port}${prefix}`)}
      `);
        child.unref();
        child.disconnect();
        process.exit(0);
      }
    );
  }
  private genCooie() {
    this.cookie = `_yapi_uid=${this.ls.get(
      'mock.uid'
    )}; _yapi_token=${this.ls.get('mock.token')}`;
  }
  async getApiList(id: string): Promise<any[]> {
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
  async login() {
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
  async updateMock(id: number) {
    const res = (await service({
      method: 'GET',
      url: `/interface/get`,
      params: {
        id
      },
      headers: {
        Cookie: this.cookie
      }
    })) as any;
    if (res.res_body) {
      const responseBody = JSON.parse(res.res_body);
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
      ret[key] = 13433332123; // 目前没有电话号码的mock
    } else if (isTime(key)) {
      ret[key] = `@date(YYYY-MM-DD HH:mm:ss)`;
    } else if (isId(key)) {
      ret[`${key}|+1`] = 1;
    } else if (isEnum(p[key])) {
      ret[`${key}|1`] = getEnum(p[key].description);
    } else if (p[key].type === 'string') {
      ret[key] = '@title(5)';
    } else if (p[key].type === 'number') {
      ret[key] = '@integer(20, 100)';
    } else if (p[key].type === 'boolean') {
      ret[key] = '@boolean';
    } else if (p[key].type === 'object') {
      ret[key] = render(p[key]);
    } else if (p[key].type === 'array') {
      ret[`${key}|1-3`] = [render(p[key].items)];
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
  return isEnumInclude(description, '0,1') || isEnumInclude(description, '1,2');
}

function isEnumInclude(description: string, numList: string): boolean {
  const seg = numList.split(',');
  const includes = seg.every((item) => description.includes(item));
  if (!includes) {
    return false;
  }
  const indexes = seg.map((item) => description.indexOf(item));
  const max = Math.max.call(indexes);
  return max === indexes[indexes.length - 1];
}
function getEnum(description: string) {
  return description.replace(/\D/g, '').split('');
}
