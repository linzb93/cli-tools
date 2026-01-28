import { LogService, type Options as LogOptions } from '@cli-tools/shared/src/business/git/log';
import { subCommandCompiler } from '@/utils';

/**
 * git log 子命令的实现
 */
export const logCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('log')
            .description('查看Git提交日志')
            .option('--head <number>', '查看最近的几个提交，默认查看最近3个')
            .option('--path <path>', '指定查看的文件目录')
            .action((options: LogOptions) => {
                new LogService().main(options);
            });
    });
};
