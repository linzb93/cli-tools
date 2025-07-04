import { join } from 'node:path';
import fs from 'fs-extra';
import chalk from 'chalk';
import BaseCommand from '../../BaseCommand';
import { cacheRoot } from '@/utils/constant';
import { splitByLine } from '@/utils/helper';

/**
 * CLI使用分析命令类
 */
export default class extends BaseCommand {
    /**
     * 主方法
     */
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
            const match = acc.find((item) => item.cmd === ret.cmd);
            if (match) {
                match.count += 1;
            } else {
                acc.push({
                    cmd: ret.cmd,
                    count: 1,
                });
            }
            return acc;
        }, []);
        result.sort((prev, next) => (prev.count > next.count ? -1 : 1));
        console.log(`近期cli使用情况如下：
${result.map((item) => `${chalk.yellow(item.cmd)}命令，使用过${chalk.cyan(item.count)}次`).join('\n')}`);
    }

    /**
     * 解析行内容
     * @param line 行内容
     * @returns 解析结果
     */
    private parseLine(line: string) {
        const timeMatch = line.match(/\[(.+)\]/);
        const time = timeMatch ? timeMatch[0] : '';
        const cmdMatch = line.match(/\s([a-z]+)/);
        const cmd = cmdMatch ? cmdMatch[0] : '';
        return {
            time,
            cmd,
            message: !cmd ? line : '',
        };
    }
}
