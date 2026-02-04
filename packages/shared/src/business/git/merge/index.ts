import { BaseService } from '@cli-tools/shared/src/base/BaseService';
import Table from 'cli-table3';
import { isGitProject, splitGitLog } from '../utils';
import { execaCommand as execa } from 'execa';
import chalk from 'chalk';
import gitAtom, { fmtCommitMsg } from '../utils/atom';

/**
 * 命令的选项接口，无需参数
 */
export interface Options {
    head: number;
}

/**
 * git merge 命令的实现类
 */
export class MergeService extends BaseService {
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
        // 获取最近几个提交的信息
        const arr = await splitGitLog(head);
        const table = new Table({
            head: ['日期', '提交内容'],
            colWidths: [30, 60],
        });
        arr.forEach((item) => {
            table.push([item.date, item.message]);
        });
        console.log(table.toString());
        const answer = await this.inquirer.prompt({
            type: 'input',
            message: `请输入合并后的提交信息，默认使用最近一次的提交信息`,
            name: 'commitMessage',
        });
        const commitMessage = fmtCommitMsg(
            answer.commitMessage !== '' ? answer.commitMessage : arr[0].message.replace(/\w+\:/g, ''),
        );
        await execa(`git reset --soft HEAD~${head}`);
        await execa('git add .');
        await execa(gitAtom.commit(commitMessage).message);
        console.log(chalk.green('合并完成'));
    }
}
