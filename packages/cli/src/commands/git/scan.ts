import { scanService } from '@/business/git/scan';
import { subCommandCompiler } from '@/utils';

/**
 * git scan 子命令的实现
 */
export const scanCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('scan')
            .description('扫描Git分支')
            .action(() => {
                scanService();
            });
    });
};
