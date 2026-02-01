import { join } from 'node:path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { BaseService } from '../../../base/BaseService';
import { cacheRoot, levelCharacters } from '../../../utils/constant';
import { splitByLine } from '../../../utils/helper';

/**
 * CLI使用分析命令类
 */
export class CliAnalyseService extends BaseService {
    /**
     * 主方法
     */
    async main() {
        const trackDir = join(cacheRoot, 'track');
        const files = (await fs.readdir(trackDir)).sort();
        const lines: string[] = [];
        for (const file of files) {
            const content = await fs.readFile(join(trackDir, file), 'utf8');
            lines.push(...splitByLine(content));
        }
        const errorLines = [];
        const result = lines.reduce<{ cmd: string; count: number; children: { cmd: string; count: number }[] }[]>(
            (acc, line) => {
                const ret = this.parseLine(line);
                if (!ret.cmd) {
                    errorLines.push(ret.message);
                    return acc;
                }
                const match = acc.find((item) => item.cmd === ret.cmd);
                if (match) {
                    match.count += 1;
                    const subMatch = match.children.find((item) => item.cmd === ret.subCmd);
                    if (subMatch) {
                        subMatch.count += 1;
                    } else if (ret.subCmd) {
                        match.children.push({
                            cmd: ret.subCmd,
                            count: 1,
                        });
                    }
                } else {
                    acc.push({
                        cmd: ret.cmd,
                        count: 1,
                        children: ret.subCmd
                            ? [
                                  {
                                      cmd: ret.subCmd,
                                      count: 1,
                                  },
                              ]
                            : [],
                    });
                }
                return acc;
            },
            [],
        );
        result.sort((prev, next) => (prev.count > next.count ? -1 : 1));
        result.forEach((item) => {
            if (!item.children) {
                return;
            }
            item.children.sort((prev, next) => (prev.count > next.count ? -1 : 1));
        });
        const firstItem = this.parseLine(lines[0]);
        console.log(`从${chalk.magenta(firstItem.time)}开始，cli共使用${chalk.hex('#ffa500')(
            lines.length,
        )}次。各命令使用情况如下：
${result
    .map((item) => {
        const title = `${chalk.yellow(item.cmd)}命令，使用过${chalk.cyan(item.count)}次`;
        if (!item.children || item.children.length === 0) {
            return title;
        }
        return `${title}
${item.children
    .map(
        (child, index) =>
            `${
                index === item.children.length - 1 ? levelCharacters.last : levelCharacters.contain
            }${levelCharacters.line.repeat(2)}${chalk.yellow(child.cmd)}，使用过${chalk.cyan(child.count)}次`,
    )
    .join('\n')}`;
    })
    .join('\n')}`);
    }

    /**
     * 解析行内容
     * @param line 行内容
     * @returns 解析结果
     */
    private parseLine(line: string) {
        const timeMatch = line.match(/\[(.+)\]/);
        const time = timeMatch ? timeMatch[1] : '';
        const cmdMatch = line.match(/\s([a-z]+)\s([a-z]*)/);
        const cmd = cmdMatch ? cmdMatch[1] : '';
        const subCmd = ['git', 'npm', 'ai'].includes(cmd) && cmdMatch ? cmdMatch[2] : '';
        return {
            time,
            cmd,
            message: !cmd ? line : '',
            subCmd,
        };
    }
}
