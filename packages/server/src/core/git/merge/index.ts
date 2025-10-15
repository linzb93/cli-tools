import BaseCommand from '../../BaseCommand';
import gitAtom from '../atom';
import Table from 'cli-table3';
import { chunk } from 'lodash-es';
import { isGitProject } from '../utils';
import { execaCommand as execa } from 'execa';
import chalk from 'chalk';
import dayjs from 'dayjs';
/**
 * 命令的选项接口，无需参数
 */
export interface Options {
    head: number;
}

/**
 * git pull 命令的实现类
 */
export default class extends BaseCommand {
    /**
     * 命令的主入口函数
     * @param {Options} options - 命令选项
     * @returns {Promise<void>}
     */
    async main(options: Options): Promise<void> {
        // 检查当前目录是否是 Git 项目
        if (!(await isGitProject())) {
            this.logger.error('当前目录不是 Git 项目');
            return;
        }
        const { head } = options;
        console.log(`您将要合并最近${head}个提交`);
        // 获取最近3个提交的信息
        const commitInfo = await execa(`git log -${head}`);
        const commitChunks = chunk(
            commitInfo.stdout
                .split('\n')
                .filter((item) => !!item)
                .map((item) => item.trim()),
            4
        );
        const arr = commitChunks.reduce<{ date: string; commit: string }[]>((acc, parentItem) => {
            const obj = {
                date: '',
                commit: '',
            };
            const dateLine = parentItem.find((sub) => sub.startsWith('Date:'));
            if (dateLine) {
                const date = dayjs(dateLine.split('Date: ')[1].trim());
                obj.date = date.format('YYYY-MM-DD HH:mm:ss');
            }
            const commitLine = parentItem.at(-1);
            if (commitLine) {
                obj.commit = commitLine.trim();
            }
            return acc.concat(obj);
        }, []);
        const table = new Table({
            head: ['日期', '提交内容'],
            colWidths: [30, 60],
        });
        arr.forEach((item) => {
            table.push([item.date, item.commit]);
        });
        console.log(table.toString());
        const answer = await this.inquirer.prompt({
            type: 'input',
            message: `请输入合并后的提交信息，默认合并以上所有提交信息`,
            name: 'commitMessage',
        });
        const commitMessage = answer.commitMessage || arr.map((item) => item.commit).join('\n');
        await execa(`git reset --soft --head=${head}`);
        await execa('git add .');
        await execa(`git commit -m "${commitMessage}"`);
        console.log(chalk.green('合并完成'));
    }
}
