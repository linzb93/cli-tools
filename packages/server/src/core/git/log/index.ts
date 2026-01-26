import BaseManager from '../../BaseManager';
import { execaCommand as execa } from 'execa';
import { splitGitLog } from '../utils';
import pMap from 'p-map';
import chalk from 'chalk';

/**
 * 命令的选项接口
 */
export interface Options {
    head: number;
    path: string;
}

export class LogManager extends BaseManager {
    async main(options: Options) {
        this.spinner.text = '正在获取Git日志';
        let head = 0;
        if (options.head) {
            head = options.head;
        } else {
            // 获取未推送的提交数量
            const unPushed = await execa('git log --oneline --not --branches');
            head = unPushed.stdout.split('\n').length || 3;
        }
        const arr = await splitGitLog(head);
        const output = await pMap(
            arr,
            async (item) => {
                const branch = await execa(`git branch --contains ${item.id}`);
                const detail = await execa(`git show --name-only ${item.id}`);
                const detailList = detail.stdout.split('\n');
                const files = [];
                for (let i = detailList.length - 1; i >= 0; i--) {
                    const line = detailList[i];
                    if (!!line) {
                        files.push(line);
                    } else {
                        break;
                    }
                }
                return {
                    ...item,
                    branch: branch.stdout.split('\n').slice(-1)[0].trim().replace('* ', ''),
                    files,
                };
            },
            { concurrency: 3 },
        );
        this.spinner.succeed('Git日志获取成功');
        output.forEach((item) => {
            console.log(`------------------------`);
            console.log(`${chalk.green(`[${item.branch}分支]`)} ${chalk.yellow(item.date)} ${item.message}`);
            if (options.path) {
                item.files.forEach((file) => {
                    if (file.startsWith(options.path)) {
                        console.log(`${chalk.blue(file)}`);
                    } else {
                        console.log(file);
                    }
                });
            } else {
                console.log(item.files.join('\n'));
            }
        });
    }
}
