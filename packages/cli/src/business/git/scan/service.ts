import { basename, join } from 'node:path';
import fsp from 'node:fs/promises';
import chalk from 'chalk';
import Table from 'cli-table3';
import { execa, execaCommand } from 'execa';
import pMap from 'p-map';
import pReduce from 'p-reduce';
import { sql } from '@cli-tools/shared/utils/sql';
import { logger } from '@/utils/logger';
import progress from '@/utils/progress';
import { createCommandReadline, type ReadlineCommand } from '@/utils/readline';
import { getGitLogData } from '../log';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
import type { Options, ResultItem } from './types';

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
 * 打印项目列表表格
 * @param list - 项目列表
 */
const printProjectTable = (list: ResultItem[]) => {
    const table = new Table({
        head: ['名称', '地址', '状态', '分支'],
        colAligns: ['left', 'left', 'left', 'left'],
    });

    table.push(
        ...list.map((item, index) => [
            `${index + 1}. ${basename(item.path)}`,
            item.path,
            `${getStatusMap(item.status)}`,
            item.branchName,
        ]),
    );
    console.log(table.toString());
};

/**
 * 打印项目的日志
 * @param item - 项目对象
 */
const printProjectLog = async (item: ResultItem) => {
    console.log(chalk.bold.cyan(`\n项目: ${item.path} (${item.branchName})`));
    try {
        let head = 3;
        try {
            const { stdout } = await execaCommand('git rev-list --count @{u}..HEAD', { cwd: item.path });
            head = parseInt(stdout.trim(), 10) || 3;
        } catch {
            // ignore
        }
        // 如果没有未推送的 commit，head 可能是 0，但这里我们想看最近的 log
        if (head === 0) head = 3;

        const logs = await getGitLogData({ cwd: item.path, head });
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
 * 扫描Git项目服务
 * @param options - 扫描选项
 */
export const scanService = async (options: Options) => {
    const { full } = options;
    logger.info('开始扫描');

    const gitDirs = await sql(async (db) => db.gitDirs);
    const allDirs = await pReduce(
        gitDirs,
        async (acc, dir) => {
            try {
                const dirs = await fsp.readdir(dir.path);
                return acc.concat(
                    await pMap(
                        dirs,
                        async (subDir) => ({
                            dir: subDir,
                            prefix: dir.path,
                            folderName: dir.name,
                        }),
                        { concurrency: 4 },
                    ),
                );
            } catch (error) {
                // 如果目录不存在或无法读取，跳过
                return acc;
            }
        },
        [] as { dir: string; prefix: string; folderName: string }[],
    );

    progress.setTotal(allDirs.length);

    const scannedList = await pMap(
        allDirs,
        async (dirInfo): Promise<ResultItem> => {
            const fullPath = join(dirInfo.prefix, dirInfo.dir);
            try {
                const { status, branchName } = await getGitProjectStatus(fullPath);
                progress.tick();
                return {
                    path: fullPath,
                    status,
                    branchName,
                };
            } catch (error) {
                progress.tick();
                // 如果获取状态失败，返回一个默认状态或者忽略
                return {
                    path: fullPath,
                    status: 3, // 默认为正常，避免中断流程
                    branchName: '',
                };
            }
        },
        { concurrency: 4 },
    );

    const srcList = scannedList.filter((item) =>
        [GitStatusMap.Uncommitted, GitStatusMap.Unpushed, GitStatusMap.NotOnMainBranch].includes(item.status),
    );

    logger.backwardConsole(2);
    const list = srcList.filter((item) => {
        if (full) {
            return true;
        }
        return item.status !== 4;
    });

    if (list.length === 0) {
        logger.success('恭喜！没有项目需要提交或推送。');
        return;
    }

    printProjectTable(list);

    /**
     * 获取指定索引的项目
     * @param indexStr - 索引字符串
     * @returns 项目对象或null
     */
    const getItem = (indexStr: string) => {
        const index = parseInt(indexStr, 10);
        if (isNaN(index) || index < 1 || index > list.length) {
            return null;
        }
        return list[index - 1];
    };

    const commands: ReadlineCommand[] = [
        {
            name: 'diff',
            usage: '<x>',
            description: '查看项目修改。如果超出20行，则用code打开。',
            handler: async (args) => {
                const item = getItem(args[0]);
                if (!item) {
                    console.log(chalk.red('请输入有效的项目编号 (1-' + list.length + ')'));
                    return;
                }

                try {
                    const { stdout: status } = await execaCommand('git status --porcelain', { cwd: item.path });
                    if (!status.trim()) {
                        console.log(chalk.green('没有要提交的代码'));
                        return;
                    }

                    const { stdout: diff } = await execaCommand('git diff HEAD', { cwd: item.path });
                    const lines = diff.split('\n');

                    if (lines.length > 20) {
                        const fileCount = status.trim().split('\n').length;
                        console.log(chalk.yellow(`修改了 ${fileCount} 个文件`));
                        console.log(chalk.blue(`正在用 VS Code 打开: ${item.path}`));
                        await execa('code', [item.path]);
                    } else {
                        console.log(diff);
                    }
                } catch (e: any) {
                    console.log(chalk.red(`执行 diff 失败: ${e.message}`));
                }
            },
        },
        {
            name: 'commit',
            usage: '<x> <message>',
            description: '提交代码',
            handler: async (args) => {
                if (args.length < 2) {
                    console.log(chalk.red('参数不足: /commit <x> <message>'));
                    return;
                }
                const item = getItem(args[0]);
                if (!item) {
                    console.log(chalk.red('请输入有效的项目编号 (1-' + list.length + ')'));
                    return;
                }
                const message = args.slice(1).join(' ');

                try {
                    await execaCommand('git add .', { cwd: item.path });
                    await execa('git', ['commit', '-m', message], { cwd: item.path });
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
            handler: async (args) => {
                if (args.length > 0) {
                    const item = getItem(args[0]);
                    if (!item) {
                        console.log(chalk.red('请输入有效的项目编号 (1-' + list.length + ')'));
                        return;
                    }
                    await printProjectLog(item);
                } else {
                    for (const item of list) {
                        await printProjectLog(item);
                    }
                }
            },
        },
        {
            name: 'push',
            usage: '[x]',
            description: '推送代码',
            handler: async (args) => {
                const pushItem = async (item: ResultItem) => {
                    try {
                        console.log(chalk.blue(`正在推送: ${basename(item.path)} ...`));
                        await execaCommand('git push', { cwd: item.path });
                        console.log(chalk.green(`推送成功: ${basename(item.path)}`));
                    } catch (e: any) {
                        console.log(chalk.red(`推送失败 (${basename(item.path)}): ${e.message}`));
                    }
                };

                if (args.length > 0) {
                    const item = getItem(args[0]);
                    if (!item) {
                        console.log(chalk.red('请输入有效的项目编号 (1-' + list.length + ')'));
                        return;
                    }
                    await pushItem(item);
                } else {
                    const unpushed = list.filter((i) => i.status === GitStatusMap.Unpushed);
                    if (unpushed.length === 0) {
                        console.log(chalk.yellow('没有发现需要推送的项目 (状态为"未推送")'));
                        return;
                    }
                    for (const item of unpushed) {
                        await pushItem(item);
                    }
                }
            },
        },
    ];

    await createCommandReadline(commands, {
        prompt: 'git-scan> ',
        exitCommand: 'exit',
    });
};
