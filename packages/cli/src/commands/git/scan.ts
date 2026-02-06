import { scanService, type Options as ScanOptions } from '@cli-tools/shared/business/git/scan';
import { subCommandCompiler } from '@/utils';

/**
 * git scan 子命令的实现
 */
export const scanCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('scan')
            .description('扫描Git分支')
            .option('--full', '是否全量扫描')
            .action((options: ScanOptions) => {
                scanService(options);
            });
    });
};
