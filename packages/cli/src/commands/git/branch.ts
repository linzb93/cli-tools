import { BranchService, type Options as BranchOptions } from '@cli-tools/shared/src/business/git/branch/get';
import { BranchDeleteService } from '@cli-tools/shared/src/business/git/branch/delete';
import { subCommandCompiler } from '@/utils';

/**
 * git branch 子命令的实现
 */
const get = () => {
    subCommandCompiler((program) => {
        program
            .description('查看Git分支')
            .option('--head <number>', '查看最近的几个提交，默认查看最近3个')
            .option('--path <path>', '指定查看的文件目录')
            .action((options: BranchOptions) => {
                new BranchService().main(options);
            });
    });
};

const deleteBranch = () => {
    subCommandCompiler((program) => {
        program
            .command('delete')
            .description('删除Git分支')
            .action(() => {
                new BranchDeleteService().main();
            });
    });
};

/**
 * git 命令入口函数
 * @param {string} subCommand - 子命令名称
 */
export const branchCommand = function (subCommand: string): void {
    // 子命令映射表
    const commandMap: Record<string, () => void> = {
        delete: deleteBranch,
    };

    // 执行对应的子命令
    if (!subCommand) {
        get();
    } else if (commandMap[subCommand]) {
        commandMap[subCommand]();
    } else {
        console.log(`未知的 git branch 子命令: ${subCommand}`);
        console.log('可用的子命令: ' + Object.keys(commandMap).join(', '));
    }
};
