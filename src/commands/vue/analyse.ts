import BaseCommand from "@/util/BaseCommand";
import Table from "cli-table3";
import fs from 'fs-extra';
import pMap from "p-map";
import { globby } from 'globby';
import chalk from "chalk";

const MAX = {
    warning: 500,
    danger: 700
};
const table = new Table({
    head: [
      chalk.green("文件地址"),
      chalk.green("行数"),
    ],
    colAligns: ["left", "center"],
  });

class Analyse extends BaseCommand {
    async run() {
        this.spinner.text = '正在分析';
        const lineFeed = '\n';
        const files = await globby(['**/*.vue',"!node_modules"]);
        const result = await pMap(files, async file => {
            const content = await fs.readFile(file, 'utf8');
            const lineLength = content.split(lineFeed).length;
            let type = 'normal';
            if (lineLength > MAX.danger) {
                type = 'danger';
            } else if (lineLength > MAX.warning) {
                type = 'warning';
            }
            return {
                file,
                type,
                lines: lineLength
            }
        });
        this.spinner.succeed('分析完成');
        table.push(...result.filter(item => item.type !== 'normal')
        .sort((prev, next) => prev.lines > next.lines ? -1 : 1)
        .map(item => {
            return [
                chalk.cyan(item.file),
                item.type === 'danger' ? chalk.red(item.lines) : chalk.yellow(item.lines)
            ]
        }))
        console.log(table.toString());
    }
}

export default function () {
    return new Analyse().run();
}