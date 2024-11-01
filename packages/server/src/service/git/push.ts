import BaseCommand from '@/common/BaseCommand';
import gitAtom from './atom';
import { getCurrentBranch } from './shared';
import { sequenceExec, type CommandItem } from '@/common/promiseFn';

export interface Options {
    force: boolean;
}

export default class extends BaseCommand {
    async main(options: Options) {
        let actionObj: CommandItem;
        if (options.force) {
            const branch = await getCurrentBranch();
            actionObj = {
                message: `git push --set-upstream origin ${branch}`,
            };
        } else {
            actionObj = gitAtom.push();
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
