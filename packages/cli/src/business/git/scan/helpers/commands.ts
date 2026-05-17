import chalk from 'chalk';
import { execaCommand } from 'execa';
import { logger } from '@/utils/logger';
import { createReadline } from '@/utils/readline/readline-v2';
import { commitSearchService } from '../../commit/search';
import { executeCommands } from '@/utils/execute-command-line';
import { checkHardcoded } from '../../shared/utils/hard-coded';
import { deployService } from '../../deploy';
import gitActions from '../../shared/utils/actions';
import { printTable, doScan } from './scanner';
import type { ResultItem, Options } from '../types';

/**
 * 获取 Git 状态对应的显示文本
 * @param status - 状态码
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
 * @param item - 项目对象
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
        if (head === 0) {
            console.log(chalk.gray('没有未推送的提交记录'));
            return;
        }
        await commitSearchService({ cwd: item.fullPath, head });
    } catch (e: any) {
        console.log(chalk.red(`获取日志失败: ${e.message}`));
    }
};

/**
 * 启动交互式命令行
 * @param list - 项目列表
 * @param options - 选项
 */
const startRepl = (list: ResultItem[], options: Options = {}) => {
    const program = createReadline({
        prompt: '',
        items: list,
    });
    const {
        utils: { close },
    } = program;

    program
        .command('/restart')
        .description('重新扫描已列出的项目')
        .action(async () => {
            logger.clearConsole();
            logger.empty();
            console.log(chalk.blue('正在重新扫描...'));
            const newList = await doScan(
                list.map((item) => item.fullPath),
                options,
            );

            if (newList.length === 0) {
                logger.success('所有项目正常，没有需要提交或推送的代码。');
                close();
                return false;
            } else {
                printTable(newList, options);
            }
        });

    program
        .command('/diff <x>')
        .description('列出有修改的文件。单个文件时显示详细改动')
        .action((args) => {
            const index = args[0];
            const item = list[parseInt(index, 10) - 1] as ResultItem;
            const fullPath = item.fullPath;
            execaCommand('git status --porcelain', { cwd: fullPath })
                .then(({ stdout: status }) => {
                    if (!status.trim()) {
                        console.log(chalk.green('没有要提交的代码'));
                        return;
                    }

                    const modifiedFiles = status
                        .split('\n')
                        .filter((line) => line.trim() && line[1] === 'M')
                        .map((line) => line.slice(3).trim());

                    if (modifiedFiles.length === 1) {
                        execaCommand('git diff HEAD', {
                            cwd: fullPath,
                            stdout: 'inherit',
                            env: { FORCE_COLOR: '3' },
                        });
                    } else {
                        execaCommand('git diff --stat', {
                            cwd: fullPath,
                            stdout: 'inherit',
                            env: { FORCE_COLOR: '3' },
                        });
                    }
                })
                .catch((e: any) => {
                    console.log(chalk.red(`执行 diff 失败: ${e.message}`));
                });
        });

    program
        .command('/hard-coded <x>')
        .description('查看项目是否有硬编码的文件')
        .action((args) => {
            const index = args[0];
            const item = list[parseInt(index, 10) - 1] as ResultItem;
            checkHardcoded(item.fullPath);
        });

    program
        .command('/commit <x> <message>')
        .description('提交代码')
        .action((args) => {
            const index = args[0];
            const message = args.slice(1).join(' ');
            const item = list[parseInt(index, 10) - 1] as ResultItem;
            executeCommands(['git add .', gitActions.commit(message)], { cwd: item.fullPath })
                .then(() => {
                    console.log(chalk.green(`提交成功: ${message}`));
                })
                .catch((e: any) => {
                    console.log(chalk.red(`提交失败: ${e.message}`));
                });
        });

    program
        .command('/log <x>')
        .description('查看已提交未推送的commit')
        .action((args) => {
            const index = args[0] || '1';
            const item = list[parseInt(index, 10) - 1] as ResultItem;
            printProjectLog(item);
        });

    program
        .command('/deploy <x> <message>')
        .description('部署代码')
        .action((args) => {
            const index = args[0];
            const message = args.slice(1).join(' ');
            const item = list[parseInt(index, 10) - 1] as ResultItem;
            const fullPath = item.fullPath;

            console.log(chalk.blue(`正在部署: ${fullPath.split('/').pop()} ...`));
            deployService({ current: true, commit: message, cwd: fullPath })
                .then(() => {
                    console.log(chalk.green(`部署成功: ${fullPath.split('/').pop()}`));
                })
                .catch((e: any) => {
                    console.log(chalk.red(`部署失败 (${fullPath.split('/').pop()}): ${e.message}`));
                });
        });

    void program.start();
};

export { getStatusMap, startRepl };
