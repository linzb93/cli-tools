import OSS from 'ali-oss';
import lodash from 'lodash';
import clipboard from 'clipboardy';
import path from 'path';
import getSetting from '../util/db';
import BaseCommand from '../util/BaseCommand';
const { random } = lodash;

export default class extends BaseCommand {
    private pic: string;
    constructor(pic: string) {
        super();
        this.pic = pic;
    }
    async run() {
        const { pic } = this;
        const ossConfig = getSetting('oss');
        const oss = new OSS({
            ...ossConfig,
            timeout: 15000
        });
        let url = '';
        try {
            const res = await oss.put(`${this.getUploadFileName()}${path.extname(pic)}`, pic);
            url = `https://oss.fjdaze.com/${res.name}`;
        } catch (error) {
            this.logger.error('上传失败');
            return;
        }
        this.logger.success(`图片上传成功，地址是：
        ${url}`);
        clipboard.writeSync(url);
    }
    getUploadFileName() {
        const timeStamp = `${random(Math.pow(10, 6), Math.pow(10, 6) * 2 - 1)}${new Date().getTime()}`;
        return `diankeduo/mdCdn/pic${timeStamp}`;
    }
}
