import BaseCommand from '@/common/BaseCommand';
import gitAtom from './atom';
import { getCurrentBranch, isCurrenetBranchPushed, remote } from './shared';
import { sequenceExec, type CommandItem } from '@/common/promiseFn';

export interface Options {
    force: boolean;
}

export default class extends BaseCommand {
    async main(options: Options) {
        let actionObj: CommandItem;
        const branch = await getCurrentBranch();
        if (options.force) {
            actionObj = {
                message: `git push --set-upstream origin ${branch}`,
            };
        } else {
            if (await isCurrenetBranchPushed()) {
                actionObj = gitAtom.push();
            } else {
                actionObj = {
                    message: `git push --set-upstream origin ${branch}`,
                };
            }
        }

        try {
            await sequenceExec([
                {
                    ...actionObj,
                    retryTimes: 100,
                    async onError(message) {
                        if (message.includes('The current branch dev has no upstream branch.')) {
                            await sequenceExec([
                                {
                                    message: `git push --set-upstream origin ${branch}`,
                                    retryTimes: 100,
                                },
                            ]);
                        }
                        this.logger.error('代码推送失败', true);
                    },
                },
            ]);
            this.logger.success('代码推送成功');
        } catch (error) {
            this.logger.error('代码拉取失败');
        }
    }
}
