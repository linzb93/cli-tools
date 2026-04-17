import chalk from 'chalk';
import { execaCommand } from 'execa';
import { logger } from '@/utils/logger';
import { createCommandReadline, displayCommands, type ReadlineCommand } from '@/utils/readline';
import { getGitLogData } from '../log';
import gitActions from '../shared/utils/actions';
import { executeCommands } from '@/utils/execuate-command-line';
import { checkHardcoded } from '../shared/utils/hard-coded';
import { deployService } from '../deploy';
import { printTable, doScan } from './scanner';
import type { ResultItem } from './types';

/**
 * 获取 Git 状态对应的显示文本
 * @param {number} status - 状态码
 * @returns 格式化后的状态文本
 */
const getStatusMap = (status: number) => {
    const map: Record<number, string> = {
        1: chalk.red('未提交'),
        2: chalk.yellow('未推送'),
        3: chalk.green('正常'),
        4: chalk.gray('不在主分支上'),
    };
    return map[status] || String(status);
};

/**
 * 打印项目的日志
 * @param {ResultItem} item - 项目对象
 */
const printProjectLog = async (item: ResultItem) => {
    console.log(chalk.bold.cyan(`\n项目: ${item.fullPath} (${item.branchName})`));
    try {
        let head = 3;
        try {
            const { stdout } = await execaCommand('git rev-list --count @{u}..HEAD', { cwd: item.fullPath });
            head = parseInt(stdout.trim(), 10) || 3;
        } catch {
            // ignore
        }
        // 如果没有未推送的 commit，head 可能是 0，但这里我们想看最近的 log
        if (head === 0) head = 3;

        const logs = await getGitLogData({ cwd: item.fullPath, head, path: '' });
        if (logs.length === 0) {
            console.log(chalk.gray('  没有未推送的提交记录'));
            return;
        }
        logs.forEach((log) => {
            console.log(`  ${chalk.green(`[${log.branch}分支]`)} ${chalk.yellow(log.date)} ${log.message}`);
            if (log.files && log.files.length) {
                log.files.forEach((file: string) => {
                    console.log(`    ${chalk.gray(file)}`);
                });
            }
        });
    } catch (e: any) {
        console.log(chalk.red(`  获取日志失败: ${e.message}`));
    }
};

/**
 * 交互命令数组
 * @param {ResultItem[]} list - 项目列表引用
 */
const commands = (list: ResultItem[]): ReadlineCommand[] => [
    {
        name: 'restart',
        description: '重新扫描已列出的项目',
        handler: async () => {
            logger.clearConsole();
            logger.empty();
            console.log(chalk.blue('正在重新扫描...'));
            const newList = await doScan(list.map((item) => item.fullPath));

            if (newList.length === 0) {
                console.log(chalk.yellow('没有项目需要提交或推送。'));
            } else {
                printTable(newList);
            }

            // 重新显示所有交互命令
            displayCommands(commands(newList), 'exit');
        },
    },
    {
        name: 'diff',
        usage: '<x>',
        description: '查看项目修改。如果超出20行，则用code打开。',
        requireList: true,
        handler: async (_args, item) => {
            const fullPath = (item as ResultItem).fullPath;
            try {
                const { stdout: status } = await execaCommand('git status --porcelain', { cwd: fullPath });
                if (!status.trim()) {
                    console.log(chalk.green('没有要提交的代码'));
                    return;
                }

                const { stdout: diff } = await execaCommand('git diff HEAD', { cwd: fullPath });
                const lines = diff.split('\n');

                if (lines.length > 20) {
                    const fileCount = status.trim().split('\n').length;
                    console.log(chalk.yellow(`修改了 ${fileCount} 个文件`));
                    console.log(chalk.blue(`正在用 VS Code 打开: ${fullPath}`));
                    await execaCommand(`code ${fullPath}`);
                } else {
                    console.log(diff);
                }
            } catch (e: any) {
                console.log(chalk.red(`执行 diff 失败: ${e.message}`));
            }
        },
    },
    {
        name: 'hard-coded',
        description: '查看项目是否有硬编码的文件',
        usage: '<x>',
        requireList: true,
        handler: async (_args, item: ResultItem) => {
            await checkHardcoded(item.fullPath);
        },
    },
    {
        name: 'commit',
        usage: '<x> <message>',
        description: '提交代码',
        requireList: true,
        handler: async (args, item: ResultItem) => {
            const message = args.slice(1).join(' ');

            try {
                await executeCommands(['git add .', gitActions.commit(message)], { cwd: item.fullPath });
                console.log(chalk.green(`提交成功: ${message}`));
            } catch (e: any) {
                console.log(chalk.red(`提交失败: ${e.message}`));
            }
        },
    },
    {
        name: 'log',
        usage: '[x]',
        description: '查看已提交未推送的commit',
        requireList: true,
        handler: async (args, item: ResultItem) => {
            if (args.length > 0) {
                await printProjectLog(item);
            } else {
                for (const i of list) {
                    await printProjectLog(i);
                }
            }
        },
    },
    {
        name: 'deploy',
        usage: '<x> <message>',
        description: '部署代码',
        requireList: true,
        handler: async (args, item: ResultItem) => {
            const message = args.slice(1).join(' ');
            const fullPath = item.fullPath;

            try {
                console.log(chalk.blue(`正在部署: ${fullPath.split('/').pop()} ...`));
                await deployService({ current: true, commit: message, cwd: fullPath });
                console.log(chalk.green(`部署成功: ${fullPath.split('/').pop()}`));
            } catch (e: any) {
                console.log(chalk.red(`部署失败 (${fullPath.split('/').pop()}): ${e.message}`));
            }
        },
    },
];

/**
 * 启动交互式命令行
 * @param {ResultItem[]} list - 项目列表
 */
const startRepl = (list: ResultItem[]) => {
    const cmds = commands(list);
    createCommandReadline(cmds, {
        prompt: 'git-scan',
        items: list,
    });
};

export { getStatusMap, printProjectLog, commands, startRepl };
