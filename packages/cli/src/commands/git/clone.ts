import { cloneService, type Options as CloneOptions } from '@/business/git/clone';
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
                cloneService({ repo, dir: options.dir });
            });
    });
};
