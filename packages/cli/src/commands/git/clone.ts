import { CloneService, type Options as CloneOptions } from '@cli-tools/shared/business/git/clone';
import { subCommandCompiler } from '@/utils';

/**
 * git clone 子命令的实现
 */
export const cloneCommand = function (): void {
    subCommandCompiler((program) => {
        program
            .command('clone <repo>')
            .description('克隆远程仓库')
            .option('--dir <dir>', '指定目标目录')
            .action((repo: string, options: CloneOptions) => {
                new CloneService().main({ repo, dir: options.dir });
            });
    });
};
