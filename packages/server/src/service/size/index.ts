import {resolve} from "node:path";
import fs, { Stats as FSStats } from "fs-extra";
import bytes from "bytes";
import axios, { AxiosResponse } from "axios";
import sizeOf from "image-size";
import through from "through2";
import del from "del";
import BaseCommand from "@/common/BaseCommand";
import { isURL, emptyWritableStream } from "@/common/helper";
import { root } from "@/common/constant";

export interface Options {
  rect: boolean;
}
interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

export default class extends BaseCommand {
  async main(filePath: string, options: Options) {
    if (isURL(filePath)) {
      let res: AxiosResponse;
      // 当filePath外面不加引号时，地址里面的逗号会被解析成空格，所以下面这段代码是要把地址还原回去
      filePath = filePath.replace(/\s/g, ",");
      try {
        res = await axios.get(filePath, {
          responseType: "stream",
        });
      } catch (e) {
        this.logger.error("文件地址不存在或无法正常下载");
        return;
      }
      let size = 0;
      const extname = this.getExtname(filePath);
      const targetName = resolve(root, `temp/getSizeImage${extname}`);
      const settingRect = options.rect;
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
            settingRect ? fs.createWriteStream(targetName) : emptyWritableStream
          )
          .on("finish", () => {
            resolve(null);
          });
      });
      const bytesSize = bytes(size);
      if (settingRect) {
        let dimensions: Dimensions;
        try {
          dimensions = sizeOf(targetName);
        } catch (error) {
          this.logger.error("无法识别的图片格式", true);
          return;
        }
        this.logger.success(
          `大小：${bytesSize}，尺寸：${dimensions.width} X ${dimensions.height}`
        );
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
    return ret;
  }
  private getExtname(filename: string) {
    const exts = [".jpg", ".png", ".webp", ".gif"];
    for (const ext of exts) {
      if (filename.includes(ext)) {
        return ext;
      }
    }
    return ".png";
  }
}
