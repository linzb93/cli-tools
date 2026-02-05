import { PullService, type Options as PullOptions } from '@cli-tools/shared/business/git/pull';
import { subCommandCompiler } from '@/utils';

/**
 * git pull 子命令的实现
 */
export const pullCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('pull')
            .description('从远程仓库拉取最新代码')
            .action((options: PullOptions) => {
                new PullService().main(options);
            });
    });
};
