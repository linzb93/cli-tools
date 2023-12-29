import fs, { Stats as FSStats } from 'fs-extra';
import bytes from 'bytes';
import axios, { AxiosResponse } from 'axios';
import sizeOf from 'image-size';
import through from 'through2';
import del from 'del';
import BaseCommand from '../util/BaseCommand.js';
import clipboard from 'clipboardy';
interface Options {
  rect: boolean;
  css: boolean;
  mobile: boolean;
}

class GetSize extends BaseCommand {
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
      let size = 0;
      const extname = this.getExtname(filePath);
      const targetName = `.temp/getSizeImage${extname}`;
      await new Promise((resolve) => {
        res.data
          .pipe(
            through(function (data, _, callback) {
              size += data.toString().length;
              this.push(data);
              callback();
            })
          )
          .pipe(
            this.options.rect
              ? fs.createWriteStream(targetName)
              : this.helper.emptyWritableStream
          )
          .on('finish', () => {
            resolve(null);
          });
      });
      const bytesSize = bytes(size);
      if (this.options.rect) {
        const dimensions = sizeOf(targetName);
        this.logger.success(
          `大小：${bytesSize}，尺寸：${dimensions.width} X ${dimensions.height}`
        );
        if (this.options.css) {
          this.logger.success('CSS代码已复制');
          if (this.options.mobile) {
            clipboard.writeSync(`width: rem(${dimensions.width});
height:rem(${dimensions.height});
background-image: url(${filePath});
background-size: 100% 100%;`);
          } else {
            clipboard.writeSync(`width:${dimensions.width}px;
height:${dimensions.height}px;
background-image:url(${filePath})`);
          }
        }
        await del(targetName);
      } else {
        this.logger.success(bytesSize);
      }
      return bytesSize;
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
        `大小：${ret}，尺寸：${dimensions.width} * ${dimensions.height}`
      );
    } else {
      this.logger.success(ret);
    }
    return ret;
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

export default (filePath: string, options: Options) => {
  new GetSize(filePath, options).run();
};
