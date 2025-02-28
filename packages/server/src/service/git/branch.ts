import chalk from 'chalk';
import pMap from 'p-map';
import Table from 'cli-table3';
import BaseCommand from '@/common/BaseCommand';
import { getBranches, deleteBranch, BranchResultItem } from './shared';
import { execaCommand as execa } from 'execa';

export interface Options {
    delete: boolean;
    key: string;
}

export default class extends BaseCommand {
    async main(options: Options) {
        if (options.delete) {
            await this.delete(options);
            return;
        }
        this.renderBranchList({
            keyword: options.key,
            showCreateTime: true,
        });
    }
    private async delete(options: Options) {
        const branches = (
            await getBranches({
                keyword: options.key,
            })
        ).reduce<
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
        const errorBranches: BranchResultItem[] = [];
        const selectedItems = selected.map((sel) => branches.find((item) => item.value === sel));
        await pMap(
            selectedItems,
            async (branchItem) => {
                // 先删除本地分支，如果成功再删除远端分支
                if (branchItem.hasLocal) {
                    try {
                        await deleteBranch(branchItem.value);
                    } catch (error) {
                        errorBranches.push(branchItem);
                        return;
                    }
                }
                if (branchItem.hasRemote) {
                    try {
                        await deleteBranch(branchItem.value, { remote: true });
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
            this.handleErrorBranches(errorBranches);
            /**
             * TODO: 删除失败的分支，查看是不是有未推送的，如果是的话，询问是否一键推送，然后再删除
             */
        }
    }
    private async handleErrorBranches(errorBranches: BranchResultItem[]) {
        const matches = await pMap(errorBranches, async (branchItem) => {
            const { stdout } = await execa(`git log origin/${branchItem.name}..${branchItem.name}`);
            return {
                name: branchItem.name,
                has: !!stdout,
            };
        });
        const renderWithLocalCommit = (has: boolean) =>
            matches
                .filter((item) => item.has === has)
                .map((item) => item.name)
                .join(',');
        this.logger.warn(`以下分支存在未推送的代码：
            ${renderWithLocalCommit(true)}
            以下分支无法删除，需要强制删除：
            ${renderWithLocalCommit(false)}`);
        const { push } = await this.inquirer.prompt({
            message: `是否执行？`,
            type: 'confirm',
            name: 'push',
        });
        if (!push) {
            return;
        }
        await Promise.all([
            pMap(
                matches.filter((item) => item.has),
                async (branchItem) => {
                    await execa(`git push origin ${branchItem.name}`);
                    await Promise.all([
                        deleteBranch(branchItem.name, { remote: false }),
                        deleteBranch(branchItem.name, { remote: true }),
                    ]);
                }
            ),
            pMap(
                matches.filter((item) => !item.has),
                async (branchItem) => {
                    await execa(`git branch -D ${branchItem.name}`);
                }
            ),
        ]);
        this.logger.success('删除成功');
    }
    private async renderBranchList(params: { keyword: string; showCreateTime: boolean }) {
        const list = await getBranches(params);
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
