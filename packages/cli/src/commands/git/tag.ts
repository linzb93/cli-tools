import { TagService, type Options as TagOptions } from '@cli-tools/shared/business/git/tag/get';
import { TagSyncService } from '@cli-tools/shared/business/git/tag/sync';
import { TagDeleteService } from '@cli-tools/shared/business/git/tag/delete';
import { subCommandCompiler } from '@/utils';

/**
 * git tag 子命令的实现
 */
const get = () => {
    subCommandCompiler((program) => {
        program
            .command('tag')
            .description('管理Git标签')
            .option('--version <version>', '设置版本号')
            .option('--type <type>', '设置标签类型前缀，默认为v')
            .option('--msg', '是否复制提交消息到剪贴板')
            .action((options: TagOptions) => {
                new TagService().main(options);
            });
    });
};
const deleteTag = () => {
    subCommandCompiler((program) => {
        program
            .command('delete')
            .description('删除Git分支')
            .action(() => {
                new TagDeleteService().main();
            });
    });
};

const syncTag = () => {
    subCommandCompiler((program) => {
        program
            .command('sync')
            .description('同步Git标签')
            .action(() => {
                new TagSyncService().main();
            });
    });
};

/**
 * git 命令入口函数
 * @param {string} subCommand - 子命令名称
 */
export const tagCommand = function (subCommand: string): void {
    // 子命令映射表
    const commandMap: Record<string, () => void> = {
        delete: deleteTag,
        sync: syncTag,
    };

    // 执行对应的子命令
    if (!subCommand) {
        get();
    } else if (commandMap[subCommand]) {
        commandMap[subCommand]();
    } else {
        console.log(`未知的 git tag 子命令: ${subCommand}`);
        console.log('可用的子命令: ' + Object.keys(commandMap).join(', '));
    }
};
