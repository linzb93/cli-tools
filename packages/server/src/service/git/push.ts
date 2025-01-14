import BaseCommand from '@/common/BaseCommand';
import gitAtom from './atom';
import { getCurrentBranch, isCurrenetBranchPushed, remote } from './shared';
import { sequenceExec, type CommandItem } from '@/common/promiseFn';

export default class extends BaseCommand {
    async main() {
        let actionObj: CommandItem;
        const remoteUrl = await remote();
        if (remoteUrl.includes('github')) {
            actionObj = gitAtom.push();
        } else if (await isCurrenetBranchPushed()) {
            actionObj = gitAtom.push();
        } else {
            const branch = await getCurrentBranch();
            actionObj = {
                message: `git push --set-upstream origin ${branch}`,
            };
        }

        try {
            await sequenceExec([
                {
                    ...actionObj,
                    retryTimes: 100,
                },
            ]);
            this.logger.success('代码推送成功');
        } catch (error) {
            this.logger.error('代码拉取失败');
        }
    }
}
