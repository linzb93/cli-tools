import { commitService, type Options as CommitOptions } from '@/business/git/commit';
import { subCommandCompiler } from '@/utils';

/**
 * git commit 子命令的实现
 */
export const commitCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('commit <data>')
            .description('提交Git代码')
            .option('--path <path>', '指定要提交的文件路径，默认当前目录')
            .action((data: string, options: CommitOptions) => {
                commitService(data, options);
            });
    });
};
