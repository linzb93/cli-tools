import { basename } from 'node:path';
import chalk from 'chalk';
import Table from 'cli-table3';
import { execaCommand as execa } from 'execa';
import useScan from './useScan';
import progress from '@cli-tools/shared/utils/progress';
import { logger } from '@cli-tools/shared/utils/logger';
import { getGitLogData } from '../log';
import inquirer from '@cli-tools/shared/utils/inquirer';

export interface Options {
    /**
     * 是否全量扫描
     * @default false
     * */
    full: boolean;
}

const table = new Table({
    head: ['名称', '地址', '状态', '分支'],
    colAligns: ['left', 'left', 'left', 'left'],
});

interface ResultItem {
    path: string;
    /**
     * 1. 未提交
     * 2. 未推送
     * 3. 正常
     * 4. 不在主分支上
     * */
    status: number;
    branchName: string;
}

const getStatusMap = (status: number) => {
    const map: Record<number, string> = {
        1: chalk.red('未提交'),
        2: chalk.yellow('未推送'),
        3: chalk.green('正常'),
        4: chalk.gray('不在主分支上'),
    };
    return map[status];
};

export const scanService = async (options: Options) => {
    const { full } = options;
    logger.info('开始扫描');
    const { counter$, list$, total$ } = await useScan();
    total$.subscribe((total: number) => {
        progress.setTotal(total);
    });
    counter$.subscribe(() => {
        progress.tick();
    });
    list$.subscribe(async (srcList: ResultItem[]) => {
        logger.backwardConsole(2);
        const list = srcList.filter((item) => {
            if (full) {
                return true;
            }
            return item.status !== 4;
        });
        table.push(
            ...list.map((item) => [basename(item.path), item.path, `${getStatusMap(item.status)}`, item.branchName]),
        );
        console.log(table.toString());

        const unpushedList = list.filter((item) => item.status === 2);
        if (unpushedList.length === 0) {
            return;
        }
        const { getUnpushedDetail } = await inquirer.prompt({
            message: '是否显示未推送详情？',
            name: 'getUnpushedDetail',
            type: 'confirm',
        });
        if (!getUnpushedDetail) {
            return;
        }
        console.log('\n' + chalk.yellow('--- 未推送详情 ---') + '\n');
        for (const item of unpushedList) {
            console.log(chalk.bold.cyan(`项目: ${item.path} (${item.branchName})`));
            try {
                let head = 3;
                try {
                    const { stdout } = await execa('git rev-list --count @{u}..HEAD', { cwd: item.path });
                    head = parseInt(stdout.trim(), 10) || 3;
                } catch {
                    // ignore
                }
                const logs = await getGitLogData({ cwd: item.path, head });
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
            console.log('');
        }
    });
};
