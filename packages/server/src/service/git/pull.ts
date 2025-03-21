import BaseCommand from '@/common/BaseCommand';
import logger from '@/common/logger';
import gitAtom from '@/service/git/atom';
import { CommandItem } from '@/common/promiseFn';
import { sequenceExec } from '@/common/promiseFn';
export default class Pull extends BaseCommand {
    async main() {
        const actionObj = gitAtom.pull() as CommandItem;
        try {
            await sequenceExec([
                {
                    ...actionObj,
                    retryTimes: 100,
                },
            ]);
            logger.success('代码拉取成功');
        } catch (error) {
            logger.error('代码拉取失败');
        }
    }
}
