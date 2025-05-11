import { Command } from 'commander';
import Push, { type Options as PushOptions } from '../../core/git/push';
import Pull, { type Options as PullOptions } from '../../core/git/pull';
import Tag, { type Options as TagOptions } from '../../core/git/tag';
import { subCommandCompiler } from '../../utils/helper';

/**
 * git push 子命令的实现
 */
const push = () => {
    subCommandCompiler((program) => {
        program
            .command('push')
            .description('将本地分支推送到远程仓库')
            .option('-f, --force', '强制推送并设置上游分支')
            .action((options: PushOptions) => {
                new Push().main(options);
            });
    });
};

/**
 * git pull 子命令的实现
 */
const pull = () => {
    subCommandCompiler((program) => {
        program
            .command('pull')
            .description('从远程仓库拉取最新代码')
            .action((options: PullOptions) => {
                new Pull().main(options);
            });
    });
};

/**
 * git tag 子命令的实现
 */
const tag = () => {
    subCommandCompiler((program) => {
        program
            .command('tag')
            .description('管理Git标签')
            .option('--version <version>', '设置版本号')
            .option('--type <type>', '设置标签类型前缀，默认为v')
            .action((options: TagOptions) => {
                new Tag().main(options);
            });
    });
};

/**
 * git 命令入口函数
 * @param {string} subCommand - 子命令名称
 * @param {string[]} data - 子命令参数
 * @param {any} options - 命令选项
 */
export default function (subCommand: string, data: string[], options: any): void {
    // 子命令映射表
    const commandMap: Record<string, () => void> = {
        push,
        pull,
        tag,
    };

    // 执行对应的子命令
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    } else {
        console.log(`未知的 git 子命令: ${subCommand}`);
        console.log('可用的子命令: ' + Object.keys(commandMap).join(', '));
    }
}
