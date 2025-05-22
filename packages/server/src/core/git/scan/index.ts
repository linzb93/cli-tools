import { basename } from 'node:path';
import chalk from 'chalk';
import Table from 'cli-table3';
import BaseCommand from '@/core/BaseCommand';
import useScan from './useScan';
import progress from '@/utils/progress';

const table = new Table({
    head: ['名称', '地址', '状态'],
    colAligns: ['left', 'left', 'left'],
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
            this.logger.backwardConsole(2);
            table.push(
                ...list.map((item) => [
                    basename(item.path),
                    item.path,
                    `${this.getStatusMap(item.status)}${
                        item.status === 4 && !!item.branchName ? ` (${item.branchName})` : ''
                    }`,
                ])
            );
            console.log(table.toString());
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
}
