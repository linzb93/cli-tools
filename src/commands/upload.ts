import OSS, { OssConfig } from 'ali-oss';
import lodash from 'lodash';
import clipboard from 'clipboardy';
import path from 'path';
import BaseCommand from '../util/BaseCommand.js';
const { random } = lodash;

interface Options {
  markdown: true;
}

class Upload extends BaseCommand {
  private pic: string;
  private options: Options;
  constructor(pic: string, options: Options) {
    super();
    this.pic = pic;
    this.options = options;
  }
  async run() {
    const { options } = this;
    const rawPic = this.pic;
    const pic = rawPic.replace(/\\/g, '/');
    if (!this.ls.get('oss')) {
      this.logger.error('没有配置OSS config，无法上传图片', true);
    }
    const ossConfig = this.ls.get('oss') as Omit<OssConfig, 'timeout'>;
    const oss = new OSS({
      ...ossConfig,
      timeout: 15000
    });
    let url = '';
    try {
      const res = await oss.put(
        `${this.getUploadFileName()}${path.extname(pic)}`,
        pic
      );
      url = `https://oss.fjdaze.com/${res.name}`;
    } catch (error) {
      this.logger.error('上传失败', true);
    }
    // 为了适配Typora的图片上传功能，url要另起一行
    this.logger.success(`图片上传成功，地址是：
        ${url}`);
    if (options.markdown) {
      clipboard.writeSync(`![](${url})`);
    } else {
      clipboard.writeSync(url);
    }
  }
  private getUploadFileName() {
    const timeStamp = `${random(
      Math.pow(10, 6),
      Math.pow(10, 6) * 2 - 1
    )}${new Date().getTime()}`;
    return `diankeduo/mdCdn/pic${timeStamp}`;
  }
}

export default (pic: string, options: Options) => {
  new Upload(pic, options).run();
};
