import { basename } from 'node:path';
import clipboard from 'clipboardy';
import BaseCommand from '@/common/BaseCommand';
import { notify } from '@/common/helper';
import chalk from 'chalk';
import { openDeployPage, getProjectName } from '@/common/jenkins';
import { CommandItemAll, sequenceExec } from '@/common/promiseFn';
import Tag from './tag';
import { getCurrentBranch, remote } from './shared';
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
     * 发布到生产分支(master)
     */
    prod: boolean;
    /**
     * 只推送，不拉取代码。（一般用于Github项目）
     */
    onlyPush: boolean;
}

type GitActions = (
    | 'merge' // 合并代码
    | 'open' // 打开部署网站
    | 'copy' // 复制地址和tag
    | 'tag' // 打tag
    | 'return'
)[]; // 返回之前的分支

interface FlowOption {
    condition: Boolean;
    actions?: GitActions;
    actionFn?: () => void;
    inquire?: boolean;
    targetBranch?: string;
    alertWhenError?: boolean;
}
/**
 * 常用命令
 */
export default class extends BaseCommand {
    private maps: FlowOption[] = [];
    private options: Options;
    async main(options: Options) {
        this.options = options;
        const remoteUrl = await remote();
        const curBranch = await getCurrentBranch();
        const isDevBranch = !['release', 'master'].includes(curBranch);
        const targetBranch = curBranch === 'master' || options.prod ? 'master' : 'release';
        // 只提交到当前分支
        this.register({
            condition: options.current,
        });
        // github项目
        this.register({
            condition: remoteUrl.includes('github.com'),
            alertWhenError: true,
        });
        // 测试阶段，从开发分支提交到release分支
        this.register({
            condition: targetBranch === 'release' && isDevBranch, // dev -> release
            actions: ['merge', 'open', 'return'],
            targetBranch,
        });
        this.register({
            condition: curBranch === 'release' && targetBranch === 'master', // release -> master
            actionFn: () => {
                this.logger.error('不允许直接从release分支合并到master分支，请从开发分支合并', true);
            },
        });
        this.register({
            // dev -> master
            condition: isDevBranch && targetBranch === 'master',
            inquire: true,
            actions: ['merge', 'tag', 'copy'],
            targetBranch,
        });
        this.register({
            // master -> master
            condition: targetBranch === curBranch && curBranch === 'master',
            actions: ['tag', 'copy'],
            targetBranch,
        });
        await this.run();
    }
    private register(options: FlowOption) {
        this.maps.push(options);
    }
    private async run() {
        for (const flow of this.maps) {
            if (flow.condition) {
                if (typeof flow.actionFn === 'function') {
                    flow.actionFn.call(this);
                    return;
                }
                this.doAction(flow);
                return;
            }
        }
    }
    private async doAction(flow: FlowOption) {
        const { actions = [], inquire, targetBranch } = flow;
        const flows: CommandItemAll[] = [...this.getBaseAction()];
        const tailFlows = [];
        let tag = '';
        const curBranch = await getCurrentBranch();
        if (inquire) {
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
            flows.push(`git checkout ${targetBranch}`, gitAtom.pull(), gitAtom.merge(curBranch), 'git push');
        }
        if (actions.includes('tag')) {
            tag = this.options.tag || (await new Tag().generateNewestTag());
            if (tag) {
                flows.push(`git tag ${tag}`);
                flows.push(`git push origin ${tag}`);
            }
        }
        if (actions.includes('return')) {
            tailFlows.push(`git checkout ${curBranch}`);
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
        if (actions.includes('open')) {
            await openDeployPage();
        }
        if (actions.includes('copy')) {
            await this.deploySuccess(tag);
        }
    }
    private getBaseAction() {
        const { options } = this;
        let commands: CommandItemAll[] = [
            'git add .',
            gitAtom.commit(this.options.commit),
            {
                ...gitAtom.pull(),
                retryTimes: 100,
            },
            {
                ...gitAtom.push({ force: true }),
                retryTimes: 100,
            },
        ];
        if (options.onlyPush) {
            commands = commands.filter((cmd: any) => cmd.message !== 'git pull');
        }
        return commands;
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
