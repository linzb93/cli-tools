import axios, { AxiosResponse } from 'axios';
import BaseCommand from '../util/BaseCommand.js';
import clipboard from 'clipboardy';

interface Options {
  extra: boolean;
}
class Http extends BaseCommand {
  private data: any[];
  private options: Options;
  constructor(data: any[], options: Options) {
    super();
    this.data = data;
    this.options = options;
  }
  async run() {
    const { data, options } = this;
    let url = data[0];
    let methods = 'get';
    let bodyStr = '{}';
    let headers: any;
    if (data[0] === 'post') {
      methods = 'post';
      url = data[1];
      bodyStr = data[2];
    }
    if (options.extra) {
      headers = {
        token: clipboard.readSync()
      };
    }
    try {
      let ret: AxiosResponse;
      if (methods === 'get') {
        ret = await axios({
          method: 'get',
          url,
          headers
        });
      } else {
        ret = await axios({
          method: 'post',
          url,
          data: (() => {
            try {
              return JSON.parse(bodyStr);
            } catch (error) {
              return {};
            }
          })(),
          headers
        });
      }
      const httpData = ret.data;
      console.log(httpData);
    } catch (error) {
      console.log('error');
      console.log((error as Error).message);
    }
  }
}

export default (data: any[], options: Options) => {
  new Http(data, options).run();
};
