import path from "node:path";
import fs from "fs-extra";
import clipboardy from "clipboardy";
import BaseCommand from "@/common/BaseCommand";
export interface Options {
  level: number;
  ignore: string;
  copy: boolean;
}

const defaultIgnoreDirs = ["node_modules", ".git", ".DS_Store"];
const characters = {
  border: "|",
  contain: "├",
  line: "─",
  last: "└",
};

export default class extends BaseCommand {
  private outputList: string[];
  private ignoreDirs: string[];
  private options: Options;
  async main(dir: string, options: Options) {
    this.init(dir, options);
    const root = process.cwd();
    await this.readdir(root);
    if (this.options.copy) {
      clipboardy.writeSync(this.outputList.join("\n"));
      this.logger.success("复制成功");
    } else {
      for (const line of this.outputList) {
        console.log(line);
      }
    }
  }
  private init(dir = '.', options: Options) {
    const defaultOptions = {
      level: 1,
    };
    this.options = {
      ...defaultOptions,
      ...options,
    };
    if (this.options.ignore) {
      this.ignoreDirs = defaultIgnoreDirs.concat(
        this.options.ignore.split(",")
      );
    } else {
      this.ignoreDirs = defaultIgnoreDirs;
    }
    this.outputList = [];
  }
  private async readdir(root: string, level = 0, paddings: number[] = []) {
    const dirs = (await fs.readdir(root)).filter(
      (dir) => !this.ignoreDirs.includes(dir)
    );
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      const stat = await fs.stat(path.resolve(root, dir));
      const preText = paddings
        .map((count) => `${characters.border} ${" ".repeat(count)}`)
        .join("");
      const filePreText = level ? preText : "";
      if (stat.isDirectory()) {
        this.outputList.push(`${filePreText}${characters.contain} ${dir}`);
        if (level < this.options.level) {
          await this.readdir(path.resolve(root, dir), level + 1, [
            ...paddings,
            Math.ceil(dir.length / 2),
          ]);
        }
      } else {
        if (i === dirs.length - 1) {
          this.outputList.push(`${filePreText}${characters.last} ${dir}`);
        } else {
          this.outputList.push(`${filePreText}${characters.contain} ${dir}`);
        }
      }
    }
  }
}
