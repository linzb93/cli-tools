import BaseCommand from '../../util/BaseCommand.js';
import set from './set.js';
import chalk from 'chalk';
import axios from 'axios';
import lodash from 'lodash';
const { flatten } = lodash;
import pMap from 'p-map';
const service = axios.create({
  baseURL: 'http://192.168.0.107:3000/api'
});
service.interceptors.response.use(
  (res) => res.data.data,
  (err) => err
);

class Mock extends BaseCommand {
  action: string;
  constructor(action: string) {
    super();
    this.action = action;
  }
  async run() {
    if (this.action === 'set') {
      set();
      return;
    }
    let db = this.helper.createDB('yapi');
    await db.read();
    let answer = {
      project: ''
    };
    if ((db.data as any).item.length === 0) {
      this.logger.error('没有项目可以选择');
      return;
    }
    if ((db.data as any).items.length === 1) {
      answer = (db.data as any).items[0];
    } else {
      answer = (await this.helper.inquirer.prompt({
        message: '请选择项目',
        type: 'list',
        choices: (db.data as any).items.map((item: any) => ({
          value: item.id,
          name: `${chalk.yellow(item.name)}: ${chalk.green(item.prefix)}`
        })),
        name: 'project'
      })) as { project: string };
    }
    // 同步api
    const headerCookie = `_yapi_uid=${this.ls.get(
      'mock.uid'
    )}; _yapi_token=${this.ls.get('mock.token')}`;
    const res = (await service({
      method: 'GET',
      url: `/interface/list_menu`,
      params: {
        // eslint-disable-next-line camelcase
        project_id: answer.project
      },
      headers: {
        Cookie: headerCookie
      }
    })) as any;
    db = this.helper.createDB(`yapi.${answer.project}`);
    await db.read();
    const result = flatten(
      res.map((item: any) => {
        return item.list.map((sub: any) => ({
          path: sub.path,
          title: sub.title,
          updateTime: sub.up_time
        }));
      })
    );
    const source = (db.data as any).items;
    await pMap(
      result,
      async (item: any) => {
        const match = source.find((s: any) => s.id === item.id);
        if (!match || match.updateTime < item.up_time) {
          await this.updateMock(match.id);
        }
      },
      { concurrency: 10 }
    );
    (db.data as any).items = result;
    await db.write();
  }
  async updateMock(id: number) {
    const headerCookie = `_yapi_uid=${this.ls.get(
      'mock.uid'
    )}; _yapi_token=${this.ls.get('mock.token')}`;
    const res = (await service({
      method: 'GET',
      url: `/interface/get`,
      params: {
        id
      },
      headers: {
        Cookie: headerCookie
      }
    })) as any;
    const responseBody = JSON.parse(res.res_body);
    render(responseBody);
  }
}

export default (action: string) => {
  new Mock(action).run();
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
      ret[`${key}|+1`] = `@id`;
    } else if (isEnum(p[key].description)) {
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
  const { description } = object;
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
