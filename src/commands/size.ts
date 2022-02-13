import fs, { Stats as FSStats } from 'fs-extra';
import bytes from 'bytes';
import axios, { AxiosResponse } from 'axios';
import sizeOf from 'image-size';
import { Readable } from 'stream';
import del from 'del';
import BaseCommand from '../util/BaseCommand.js';

interface Options {
  rect: boolean;
}

export default class extends BaseCommand {
  private filePath: string;
  private options: Options;
  constructor(filePath: string, options: Options) {
    super();
    this.filePath = filePath;
    this.options = options;
    this.helper.validate(
      {
        file: filePath
      },
      {
        file: {
          validator: (_, value) =>
            this.helper.isURL(value) || this.helper.isPath(value),
          message: '请输入图片网址，或本地地址'
        }
      }
    );
  }
  async run() {
    let { filePath } = this;
    if (this.helper.isURL(filePath)) {
      let res: AxiosResponse;
      // 当filePath外面不加引号时，地址里面的逗号会被解析成空格，所以下面这段代码是要把地址还原回去
      filePath = filePath.replace(/\s/g, ',');
      try {
        res = await axios.get(filePath, {
          responseType: 'stream'
        });
      } catch (e) {
        this.logger.error('文件地址不存在或无法正常下载');
        return;
      }
      if (this.options.rect) {
        const extname = this.getExtname(filePath);
        const targetName = `.temp/getSizeImage${extname}`;
        if (!fs.existsSync('.temp')) {
          await fs.mkdir('.temp');
        }
        const ws = fs.createWriteStream(targetName);
        res.data.pipe(ws);
        await new Promise((resolve) => {
          ws.on('finish', () => {
            resolve(null);
          });
        });
        const ret = bytes((await fs.stat(targetName)).size);
        const dimensions = sizeOf(targetName);
        this.logger.success(
          `大小：${ret}，尺寸：${dimensions.width} X ${dimensions.height}`
        );
        await del(targetName);
        return ret;
      }
      const ret = bytes(await this.getSize(res.data));
      this.logger.success(ret);
      return ret;
    }
    let fileData: FSStats;
    try {
      fileData = await fs.stat(filePath);
    } catch (error) {
      this.logger.error(`文件${filePath}不存在或无法读取`);
      return;
    }
    const ret = bytes(fileData.size);
    if (this.options.rect) {
      const dimensions = sizeOf(filePath);
      this.logger.success(
        `大小：${ret}，尺寸：${dimensions.width} X ${dimensions.height}`
      );
    } else {
      this.logger.success(ret);
    }
    return ret;
  }
  private async getSize(inputStream: Readable): Promise<number> {
    let len = 0;
    return new Promise((resolve) => {
      inputStream.on('data', (str) => {
        len += str.length;
      });
      inputStream.on('end', () => {
        resolve(len);
      });
    });
  }
  private getExtname(filename: string) {
    const exts = ['.jpg', '.png', '.webp', '.gif'];
    for (const ext of exts) {
      if (filename.includes(ext)) {
        return ext;
      }
    }
    return '.png';
  }
}
