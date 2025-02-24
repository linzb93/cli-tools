import { basename } from 'node:path';
import clipboard from 'clipboardy';
import BaseCommand from '@/common/BaseCommand';
import { notify } from '@/common/helper';
import chalk from 'chalk';
import { openDeployPage, getProjectName } from '@/common/jenkins';
import { CommandItemAll, sequenceExec } from '@/common/promiseFn';
import Tag from './tag';
import { isCurrenetBranchPushed, getMasterBranchName, getPushStatus, getCurrentBranch, remote } from './shared';
import gitAtom from './atom';

export interface Options {
    commit: string;
    tag: string;
    /**
     * 发布到当前分支，只执行基础操作
     */
    current: boolean;
    help: boolean;
    /**
     * 打开Jenkins项目主页
     */
    open: boolean;
    /**
     * 发布到生产分支
     */
    prod: boolean;
}

interface FlowOption {
    condition: Boolean;
    actions?: (
        | 'merge' // 合并代码
        | 'open' // 打开部署网站
        | 'copy' // 复制地址和tag
        | 'tag' // 打tag
        | 'return'
    )[]; // 返回之前的分支
    handler?: () => void;
    inquire?: boolean;
    targetBranch?: string;
    alertWhenError?: boolean;
}
/**
 * 常用命令
 */
export default class extends BaseCommand {
    private flowMaps: FlowOption[] = [];
    private options: Options;
    /**
     * 当前分支的名称
     */
    private currenetBranch: string;
    /**
     * 是否是国外项目（目前仅有github）。国外项目大概率提交会断，
     * 所以省去了拉取代码的流程，除非报错。
     */
    private isForeignProject = false;
    async main(options: Options) {
        this.options = options;
        const remoteUrl = await remote();
        this.isForeignProject = remoteUrl.includes('https://github.com');
        this.currenetBranch = await getCurrentBranch();
        const isDevBranch = this.currenetBranch !== 'release' && !this.isMasterBranch();
        const masterBranchName = await getMasterBranchName();
        const targetBranch = this.isMasterBranch() || options.prod ? masterBranchName : 'release';
        // 只提交到当前分支
        this.register({
            condition: options.current,
        });
        // github项目
        this.register({
            condition: this.isForeignProject,
            alertWhenError: true,
        });
        // 测试阶段，从开发分支提交到release分支
        this.register({
            condition: targetBranch === 'release' && isDevBranch, // dev -> release
            actions: ['merge', 'open', 'return'],
            targetBranch,
        });
        this.register({
            condition: this.currenetBranch === 'release' && targetBranch === masterBranchName, // release -> master
            handler: () => {
                this.logger.error('不允许直接从release分支合并到主分支，请从开发分支合并', true);
            },
        });
        this.register({
            // dev -> master
            condition: isDevBranch && targetBranch === masterBranchName,
            inquire: true,
            actions: ['merge', 'tag', 'copy'],
            targetBranch,
        });
        this.register({
            // master -> master
            condition: targetBranch === this.currenetBranch && this.currenetBranch === masterBranchName,
            actions: ['tag', 'copy'],
            targetBranch,
        });
        await this.run();
    }
    private register(options: FlowOption) {
        this.flowMaps.push(options);
    }
    private async run() {
        for (const flow of this.flowMaps) {
            if (flow.condition) {
                if (typeof flow.handler === 'function') {
                    flow.handler.call(this);
                    return;
                }
                this.doAction(flow);
                return;
            }
        }
    }
    private async doAction(flow: FlowOption) {
        const { actions = [], inquire, targetBranch } = flow;
        const flows: CommandItemAll[] = await this.getBaseAction();
        const tailFlows = [];
        let tag = '';
        if (inquire && !process.env.DEBUG) {
            const { answer } = await this.inquirer.prompt({
                message: `确认更新到${targetBranch}分支？`,
                name: 'answer',
                type: 'confirm',
            });
            if (!answer) {
                return;
            }
        }
        if (actions.includes('merge')) {
            flows.push(`git checkout ${targetBranch}`, gitAtom.pull(), gitAtom.merge(this.currenetBranch), 'git push');
        }
        if (actions.includes('tag')) {
            tag = this.options.tag || (await new Tag().generateNewestTag({}));
            if (tag) {
                flows.push(`git tag ${tag}`);
                flows.push(`git push origin ${tag}`);
            }
        }
        if (actions.includes('return')) {
            tailFlows.push(`git checkout ${this.currenetBranch}`);
        }
        try {
            await sequenceExec([...flows, ...tailFlows]);
        } catch (error) {
            if (flow.alertWhenError) {
                notify(`${basename(process.cwd())}项目更新失败！`);
            } else {
                this.logger.error(error);
            }
            return;
        }
        if (process.env.DEBUG) {
            return;
        }
        if (actions.includes('open') || this.options.open) {
            await openDeployPage();
        }
        if (actions.includes('copy')) {
            await this.deploySuccess(tag);
        }
    }
    private async getBaseAction() {
        const isLocalBranch = !(await isCurrenetBranchPushed());
        const status = await getPushStatus();
        const commands: CommandItemAll[] = [];
        if (status === 1) {
            commands.push('git add .', gitAtom.commit(this.options.commit));
        }
        if (!this.isForeignProject && !isLocalBranch) {
            commands.push({
                ...gitAtom.pull(),
                retryTimes: 100,
            });
        }
        commands.push({
            ...gitAtom.push(isLocalBranch, this.currenetBranch),
            retryTimes: 100,
        });
        return commands;
    }
    private isMasterBranch() {
        return ['master', 'main'].includes(this.currenetBranch);
    }
    private async deploySuccess(tag: string) {
        if (!tag) {
            this.logger.success('部署成功');
            return;
        }
        const { onlineId } = await getProjectName();
        const copyText = `${onlineId}，${tag}`;
        this.logger.success(`部署成功，复制填入更新文档：${chalk.cyan(copyText)}`);
        clipboard.writeSync(copyText);
    }
}
