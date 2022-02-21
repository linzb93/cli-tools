import OSS, { OssConfig } from 'ali-oss';
import lodash from 'lodash';
import clipboard from 'clipboardy';
import path from 'path';
import BaseCommand from '../util/BaseCommand.js';
const { random } = lodash;

class Upload extends BaseCommand {
  private pic: string;
  constructor(pic: string) {
    super();
    this.pic = pic;
  }
  async run() {
    const rawPic = this.pic;
    const pic = rawPic.replace(/\\/g, '/');
    const ossConfig = this.db.get('oss') as Omit<OssConfig, 'timeout'>;
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
    clipboard.writeSync(url);
  }
  private getUploadFileName() {
    const timeStamp = `${random(
      Math.pow(10, 6),
      Math.pow(10, 6) * 2 - 1
    )}${new Date().getTime()}`;
    return `diankeduo/mdCdn/pic${timeStamp}`;
  }
}

export default (pic: string) => {
  new Upload(pic).run();
};
