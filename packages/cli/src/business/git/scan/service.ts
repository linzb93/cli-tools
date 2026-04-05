import { basename, join } from 'node:path';
import chalk from 'chalk';
import { execa, execaCommand } from 'execa';
import pMap from 'p-map';
import { expandWorkDirs, scanDirs, printResultTable } from '@/utils/scan';
import { logger } from '@/utils/logger';
import { createCommandReadline, type ReadlineCommand } from '@/utils/readline';
import { getGitLogData } from '../log';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
import gitActions from '../shared/utils/actions';
import { executeCommands } from '@/utils/promise';
import type { ResultItem } from './types';
import { checkHardcoded } from '../shared/utils/hard-coded';

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
 * 过滤需要处理的项目
 * @param {ResultItem[]} items - 项目列表
 * @param {boolean} full - 是否显示所有项目
 * @returns {ResultItem[]} - 过滤后的项目列表
 */
const filterProjects = (items: ResultItem[], full: boolean): ResultItem[] => {
    const srcList = items.filter((item) =>
        [GitStatusMap.Uncommitted, GitStatusMap.Unpushed, GitStatusMap.NotOnMainBranch].includes(item.status),
    );
    return srcList.filter((item) => {
        if (full) return true;
        return item.status !== 4;
    });
};

/**
 * 执行扫描并返回项目列表
 * @returns {ResultItem[]} - 项目列表
 */
const doScan = async (): Promise<ResultItem[]> => {
    const allDirs = await expandWorkDirs();

    const scannedList = await scanDirs<ResultItem>(allDirs, async (dirInfo) => {
        const fullPath = join(dirInfo.prefix, dirInfo.dir);
        const { status, branchName } = await getGitProjectStatus(fullPath);
        return {
            fullPath,
            status,
            branchName,
        };
    });

    return filterProjects(scannedList, false);
};

/**
 * 扫描Git项目服务
 * @param options - 扫描选项
 */
export const scanService = async () => {
    let list = await doScan();

    if (list.length === 0) {
        logger.success('恭喜！没有项目需要提交或推送。');
        return;
    }

    printResultTable(list, {
        head: ['名称', '地址', '状态', '分支'],
        map: (item, index) => [
            `${index + 1}. ${basename(item.fullPath)}`,
            item.fullPath,
            getStatusMap(item.status),
            item.branchName,
        ],
    });

    const commands: ReadlineCommand[] = [
        {
            name: 'restart',
            description: '重新扫描已列出的项目',
            handler: async (_, ctx) => {
                console.log(chalk.blue('正在重新扫描...'));
                const newList = await pMap(
                    list,
                    async (item): Promise<ResultItem> => {
                        try {
                            const { status, branchName } = await getGitProjectStatus(item.fullPath);
                            return { ...item, status, branchName };
                        } catch {
                            return item;
                        }
                    },
                    { concurrency: 4 },
                );

                list.length = 0;
                list.push(...filterProjects(newList, false));

                if (list.length === 0) {
                    console.log(chalk.yellow('没有项目需要提交或推送。'));
                } else {
                    printResultTable(list, {
                        head: ['名称', '地址', '状态', '分支'],
                        map: (item, index) => [
                            `${index + 1}. ${basename(item.fullPath)}`,
                            item.fullPath,
                            getStatusMap(item.status),
                            item.branchName,
                        ],
                    });
                }
            },
        },
        {
            name: 'diff',
            usage: '<x>',
            description: '查看项目修改。如果超出20行，则用code打开。',
            requireList: true,
            handler: async (args, ctx) => {
                const item = ctx.getItem<ResultItem>(args[0]);
                if (!item) {
                    console.log(chalk.red('请输入有效的项目编号 (1-' + ctx.list!.length + ')'));
                    return;
                }

                try {
                    const { stdout: status } = await execaCommand('git status --porcelain', { cwd: item.fullPath });
                    if (!status.trim()) {
                        console.log(chalk.green('没有要提交的代码'));
                        return;
                    }

                    const { stdout: diff } = await execaCommand('git diff HEAD', { cwd: item.fullPath });
                    const lines = diff.split('\n');

                    if (lines.length > 20) {
                        const fileCount = status.trim().split('\n').length;
                        console.log(chalk.yellow(`修改了 ${fileCount} 个文件`));
                        console.log(chalk.blue(`正在用 VS Code 打开: ${item.fullPath}`));
                        await execaCommand(`code ${item.fullPath}`);
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
            handler: async (args, ctx) => {
                const item = ctx.getItem<ResultItem>(args[0]);
                if (!item) {
                    console.log(chalk.red('请输入有效的项目编号 (1-' + ctx.list!.length + ')'));
                    return;
                }
                await checkHardcoded(item.fullPath);
            },
        },
        {
            name: 'commit',
            usage: '<x> <message>',
            description: '提交代码',
            requireList: true,
            handler: async (args, ctx) => {
                const item = ctx.getItem<ResultItem>(args[0]);
                if (!item) {
                    console.log(chalk.red('请输入有效的项目编号 (1-' + ctx.list!.length + ')'));
                    return;
                }
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
            handler: async (args, ctx) => {
                if (args.length > 0) {
                    const item = ctx.getItem<ResultItem>(args[0]);
                    if (!item) {
                        console.log(chalk.red('请输入有效的项目编号 (1-' + ctx.list!.length + ')'));
                        return;
                    }
                    await printProjectLog(item);
                } else {
                    for (const item of ctx.list as ResultItem[]) {
                        await printProjectLog(item);
                    }
                }
            },
        },
        {
            name: 'push',
            usage: '[x]',
            description: '推送代码',
            requireList: true,
            handler: async (args, ctx) => {
                const pushItem = async (item: ResultItem) => {
                    try {
                        console.log(chalk.blue(`正在推送: ${basename(item.fullPath)} ...`));
                        await executeCommands([gitActions.push()], { cwd: item.fullPath });
                        console.log(chalk.green(`推送成功: ${basename(item.fullPath)}`));
                    } catch (e: any) {
                        console.log(chalk.red(`推送失败 (${basename(item.fullPath)}): ${e.message}`));
                    }
                };

                if (args.length > 0) {
                    const item = ctx.getItem<ResultItem>(args[0]);
                    if (!item) {
                        console.log(chalk.red('请输入有效的项目编号 (1-' + ctx.list!.length + ')'));
                        return;
                    }
                    await pushItem(item);
                } else {
                    const unpushed = (ctx.list as ResultItem[]).filter((i) => i.status === GitStatusMap.Unpushed);
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
        items: list,
    });
};
