import { join } from "node:path";
import fs from 'fs-extra';
import chalk from "chalk";
import BaseCommand from "@/common/BaseCommand";
import { cacheRoot } from "@/common/constant";
import {splitByLine} from '@/common/helper';

export default class extends BaseCommand {
  async main() {
    const fileContent = await fs.readFile(join(cacheRoot, 'track.txt'), 'utf8');
    const lines = splitByLine(fileContent);
    const errorLines = [];
    const result = lines.reduce((acc, line) => {
      const ret = this.parseLine(line);
      if (!ret.cmd) {
        errorLines.push(ret.message);
        return acc;
      }
      const match = acc.find(item => item.cmd === ret.cmd);
      if (match) {
        match.count += 1;
      } else {
        acc.push({
          cmd: ret.cmd,
          count: 1
        })
      }
      return acc;
    }, []);
    console.log(`近期cli使用情况如下：
${result.map(item => `${chalk.yellow(item.cmd)}命令，使用过${chalk.cyan(item.count)}次`).join('\n')}`)
  }

  private parseLine(line:string) {
    const timeMatch = line.match(/\[(.+)\]/);
    const time = timeMatch ? timeMatch[0] : '';
    const cmdMatch = line.match(/\s([a-z]+)/);
    const cmd = cmdMatch ? cmdMatch[0] : '';
    return {
      time,
      cmd,
      message: !cmd ? line : ''
    }
  }
}