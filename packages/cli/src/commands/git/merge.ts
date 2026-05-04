import { mergeService, type Options as MergeOptions } from '@/business/git/merge';
import { subCommandCompiler } from '@/utils/command';

/*
 * git merge 子命令的实现
 */
export const mergeCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('merge')
            .description('合并最近的提交')
            .option('-n,--head <number>', '合并最近的几个提交，默认合并最近3个')
            .action((options: MergeOptions) => {
                mergeService(options);
            });
    });
};
