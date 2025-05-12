import { basename } from 'node:path';
import chalk from 'chalk';
import Table from 'cli-table3';
import BaseCommand from '@/core/BaseCommand';
import useScan from './useScan';
import progress from '@/utils/progress';
import Listr from 'listr';
import gitAtom from '../atom';
import { executeCommands } from '@/utils/promise';

const table = new Table({
    head: ['名称', '地址', '状态'],
    colAligns: ['left', 'left', 'center'],
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
}

export default class extends BaseCommand {
    async main() {
        this.logger.info('开始扫描');
        const { counter$, list$, total$ } = await useScan();
        total$.subscribe((total: number) => {
            progress.setTotal(total);
        });
        counter$.subscribe(() => {
            progress.tick();
        });
        list$.subscribe(async (list: ResultItem[]) => {
            this.logger.success(`扫描完成`);
            table.push(...list.map((item) => [basename(item.path), item.path, this.getStatusMap(item.status)]));
            console.log(table.toString());
            await this.confirmPushAll(list);
        });
    }
    private getStatusMap(status: number) {
        const map = {
            1: chalk.red('未提交'),
            2: chalk.yellow('未推送'),
            3: chalk.green('正常'),
            4: chalk.gray('不在主分支上'),
        };
        return map[status];
    }
    private async confirmPushAll(list: ResultItem[]) {
        if (!list.some((item) => item.status === 2)) {
            // 没有需要推送的项目，直接退出进程。
            process.exit(0);
        }
        const { confirm } = await this.inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: '是否推送？',
        });
        if (!confirm) {
            process.exit(0);
        }
        const tasks = new Listr(
            list
                .filter((item) => item.status === 2)
                .map((item) => ({
                    title: item.path,
                    task: () =>
                        executeCommands([
                            {
                                ...gitAtom.push(item.path),
                                retryTimes: 100,
                            },
                        ]),
                })),
            {
                concurrent: true,
            }
        );
        tasks.run().then(() => {
            this.logger.success('推送完成');
            process.exit(0);
        });
    }
}
