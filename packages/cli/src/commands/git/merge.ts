import { mergeService, type Options as MergeOptions } from '@cli-tools/shared/business/git/merge';
import { subCommandCompiler } from '@/utils';

/*
 * git merge 子命令的实现
 */
export const mergeCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('merge')
            .description('合并最近的提交')
            .option('--head <number>', '合并最近的几个提交，默认合并最近3个')
            .action((options: MergeOptions) => {
                mergeService(options);
            });
    });
};
