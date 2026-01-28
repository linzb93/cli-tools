import chalk from 'chalk';
import Table from 'cli-table3';
import BaseService from '../../../core/BaseService.abstract';
import { getAllBranches } from '../../shared/utils';

export interface Options {
    /**
     * 是否删除分支
     * @defalut false
     * */
    delete: boolean;
    /**
     * 关键词
     * */
    key: string;
}

export class BranchService extends BaseService {
    async main(options: Options) {
        this.renderBranchList({
            keyword: options.key,
            showCreateTime: true,
        });
    }

    private async renderBranchList(params: { keyword: string; showCreateTime: boolean }) {
        const list = await getAllBranches();
        const branches = list.reduce<
            {
                name: string;
                type: string;
                createTime: string;
            }[]
        >((acc, branchItem) => {
            let type = chalk.cyan('all');
            if (branchItem.hasLocal && !branchItem.hasRemote) {
                type = chalk.yellow('local');
            } else if (!branchItem.hasLocal && branchItem.hasRemote) {
                type = chalk.blue('remote');
            }
            return acc.concat({
                name: branchItem.name,
                type,
                createTime: branchItem.createTime,
            });
        }, []);
        const table = new Table({
            head: ['名称', '类型', '创建时间'],
        });
        table.push(
            ...branches.map((item) => {
                return [item.name, item.type, item.createTime];
            }),
        );
        console.log(table.toString());
    }
}
