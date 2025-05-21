import { execaCommand } from 'execa';
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

interface BranchExtraItem {
    name: string;
    value: string;
    hasLocal: boolean;
    hasRemote: boolean;
    createTime: string;
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
        const branches = (await getAllBranches()).reduce<BranchExtraItem[]>((acc, branchItem) => {
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
        const errorBranches: BranchExtraItem[] = [];
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
            return;
        }

        // 询问用户是否处理删除失败的分支
        const handleFailedBranchesAnswer = await this.inquirer.prompt({
            type: 'confirm',
            name: 'handleFailedBranches',
            message: '是否处理删除失败的分支？',
            default: false,
        });

        if (!handleFailedBranchesAnswer.handleFailedBranches) {
            this.logger.warn('已取消处理删除失败的分支');
            return;
        }

        // 检查未推送的 commit
        const branchesWithUnpushedCommits: BranchExtraItem[] = [];
        const branchesWithoutUnpushedCommits: BranchExtraItem[] = [];

        for (const branch of errorBranches) {
            try {
                const { stdout } = await execaCommand(`git log origin/${branch.value}..${branch.value}`);
                if (stdout.trim()) {
                    branchesWithUnpushedCommits.push(branch);
                } else {
                    branchesWithoutUnpushedCommits.push(branch);
                }
            } catch (error) {
                // 如果出错，可能是分支不存在于远程，视为有未推送的 commit
                branchesWithUnpushedCommits.push(branch);
            }
        }

        // 处理有未推送 commit 的分支
        if (branchesWithUnpushedCommits.length > 0) {
            this.logger.warn('以下分支有未推送的 commit：');
            branchesWithUnpushedCommits.forEach((branch) => {
                this.logger.warn(`- ${branch.name}`);
            });

            const pushAnswer = await this.inquirer.prompt({
                type: 'confirm',
                name: 'pushBranches',
                message: '是否推送这些分支的 commit？',
                default: false,
            });

            if (pushAnswer.pushBranches) {
                for (const branch of branchesWithUnpushedCommits) {
                    try {
                        await execaCommand(`git push origin ${branch.value}`);
                        this.logger.success(`已推送分支 ${branch.name}`);
                    } catch (error) {
                        this.logger.error(`推送分支 ${branch.name} 失败`);
                    }
                }
            } else {
                this.logger.warn('已取消推送未提交的分支');
                return;
            }
        }

        // 处理没有未推送 commit 的分支
        if (branchesWithoutUnpushedCommits.length > 0) {
            this.logger.warn('以下分支没有未推送的 commit：');
            branchesWithoutUnpushedCommits.forEach((branch) => {
                this.logger.warn(`- ${branch.name}`);
            });

            const forceDeleteAnswer = await this.inquirer.prompt({
                type: 'confirm',
                name: 'forceDelete',
                message: '是否强制删除这些分支？',
                default: false,
            });

            if (forceDeleteAnswer.forceDelete) {
                for (const branch of branchesWithoutUnpushedCommits) {
                    try {
                        await deleteBranch({
                            branchName: branch.value,
                            force: true,
                        });
                        await deleteBranch({
                            branchName: branch.value,
                            remote: true,
                            force: true,
                        });
                        this.logger.success(`已强制删除分支 ${branch.name}`);
                    } catch (error) {
                        this.logger.error(`强制删除分支 ${branch.name} 失败`);
                    }
                }
            } else {
                this.logger.warn('已取消强制删除分支');
            }
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
