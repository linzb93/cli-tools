import chalk from 'chalk';
import pMap from 'p-map';
import BaseCommand from '@/common/BaseCommand';
import { getBranches, deleteBranch, BranchResultItem } from './shared';

export interface Options {
    type: 'all' | 'remote' | 'local';
}

export default class extends BaseCommand {
    async main(options: Options) {
        const branches = (await getBranches()).reduce<
            {
                name: string;
                value: string;
                hasLocal: boolean;
                hasRemote: boolean;
            }[]
        >((acc, branchItem) => {
            if (['master', 'main', 'release'].includes(branchItem.name)) {
                return acc;
            }
            if (options.type === 'all') {
                if (!branchItem.hasLocal || !branchItem.hasRemote) {
                    return acc;
                }
                return acc.concat({
                    name: `${branchItem.name}${chalk.cyan('(all)')}`,
                    value: branchItem.name,
                    hasLocal: true,
                    hasRemote: true,
                });
            }
            if (options.type === 'local') {
                if (!(branchItem.hasLocal && !branchItem.hasRemote)) {
                    return acc;
                }
                return acc.concat({
                    name: `${branchItem.name}${chalk.yellow('(local)')}`,
                    value: branchItem.name,
                    hasLocal: true,
                    hasRemote: false,
                });
            }
            if (options.type === 'remote') {
                if (!(branchItem.hasRemote && !branchItem.hasLocal)) {
                    return acc;
                }
                return acc.concat({
                    name: `${branchItem.name}${chalk.blue('(remote)')}`,
                    value: branchItem.name,
                    hasLocal: false,
                    hasRemote: true,
                });
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
            this.logger.warn(`以下分支没有删除，请确认代码是否已提交或合并：
${errorBranches.map((item) => item.name).join(',')}`);
            /**
             * TODO: 删除失败的分支，查看是不是有未推送的，如果是的话，询问是否一键推送，然后再删除
             */
        }
    }
}
