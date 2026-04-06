import { iterationService, type IterationOptions } from '@/business/git/iteration';
import { subCommandCompiler } from '@/utils';

export const iterationCommand = (options: IterationOptions) => {
    subCommandCompiler((program) => {
        program
            .command('iteration')
            .description('迭代版本')
            .option('--version <version>', '指定版本号参数')
            .option('--fix', '是否为三级修复版本')
            .option('--debug', '是否为调试模式')
            .action((options) => {
                iterationService(options);
            });
    });
};
