import chalk from 'chalk';
import pMap from 'p-map';
import Table from 'cli-table3';
import BaseCommand from '@/core/BaseCommand';
import { getAllBranches, deleteBranch, BranchInfo } from '../utils';

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

export default class extends BaseCommand {
    async main(options: Options) {
        if (options.delete) {
            await this.delete();
            return;
        }
        this.renderBranchList({
            keyword: options.key,
            showCreateTime: true,
        });
    }
    private async delete() {
        const branches = (await getAllBranches()).reduce<
            {
                name: string;
                value: string;
                hasLocal: boolean;
                hasRemote: boolean;
                createTime: string;
            }[]
        >((acc, branchItem) => {
            if (['master', 'main', 'release'].includes(branchItem.name)) {
                return acc;
            }
            let output = branchItem.name;
            if (branchItem.hasLocal && branchItem.hasRemote) {
                output += chalk.cyan('(all)');
            } else if (branchItem.hasLocal) {
                output += chalk.yellow('(local)');
            } else {
                output += chalk.blue('(remote)');
            }
            return acc.concat({
                name: output,
                value: branchItem.name,
                hasLocal: branchItem.hasLocal,
                hasRemote: branchItem.hasRemote,
                createTime: branchItem.createTime,
            });
        }, []);
        let selected: string[] = [];
        const answer = await this.inquirer.prompt({
            message: '请选择要删除的分支',
            type: 'checkbox',
            choices: branches,
            name: 'selected',
        });
        selected = answer.selected;
        if (!selected.length) {
            this.logger.error('您没有选择任何标签，已退出');
            return;
        }
        this.spinner.text = '正在删除所选分支';
        const errorBranches: BranchInfo[] = [];
        const selectedItems = selected.map((sel) => branches.find((item) => item.value === sel));
        await pMap(
            selectedItems,
            async (branchItem) => {
                // 先删除本地分支，如果成功再删除远端分支
                if (branchItem.hasLocal) {
                    try {
                        await deleteBranch({
                            branchName: branchItem.value,
                        });
                    } catch (error) {
                        errorBranches.push(branchItem);
                        return;
                    }
                }
                if (branchItem.hasRemote) {
                    try {
                        await deleteBranch({
                            remote: true,
                            branchName: branchItem.value,
                        });
                    } catch (error) {
                        errorBranches.push(branchItem);
                        return;
                    }
                }
            },
            { concurrency: 4 }
        );
        this.spinner.stop();
        if (!errorBranches.length) {
            this.logger.success('删除成功');
        } else {
            // 列出删除失败的分支
            this.logger.error('以下分支删除失败：');
            this.logger.error(errorBranches.map((item) => item.name).join(','));
        }
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
            })
        );
        console.log(table.toString());
    }
}
