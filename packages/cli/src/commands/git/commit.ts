import { commitService } from '@/business/git/commit/home';
import type { Options as CommitOptions } from '@/business/git/commit/home';
import { subCommandCompiler } from '@/utils/command';
import { commitSearchService } from '@/business/git/commit/search/service';
import type { Options as SearchOptions } from '@/business/git/commit/search/types';

const entry = () => {
    subCommandCompiler((program) => {
        program
            .command('commit')
            .description('提交Git代码')
            .option('-m, --message <message>', '提交信息')
            .option('--path <path>', '指定要提交的文件路径，默认当前目录')
            .option('--merge', '与上一条提交记录合并，使用上一条的提交信息')
            .action((options: CommitOptions) => {
                commitService(options);
            });
    });
};

const search = () => {
    subCommandCompiler(
        (program) => {
            program
                .command('search')
                .description('搜索Git提交记录')
                .option('-k, --keyword <keyword>', '搜索关键词')
                .option('-n,--head <head>', '指定要搜索的提交记录数量，默认10条')
                .action((options: SearchOptions) => {
                    commitSearchService(options);
                });
        },
        { level: 3 },
    );
};
/**
 * git commit 子命令的实现
 */
export const commitCommand = (restCommand: string[]): void => {
    // 子命令映射表
    const commandMap: Record<string, () => void> = {
        search: search,
    };

    // 执行对应的子命令
    if (!restCommand || !restCommand.length || restCommand[0].startsWith('--') || restCommand[0].startsWith('-')) {
        entry();
    } else if (commandMap[restCommand[0]]) {
        commandMap[restCommand[0]]();
    } else {
        console.log(`未知的 git commit 子命令: ${restCommand[0]}`);
        console.log('可用的子命令: ' + Object.keys(commandMap).join(', '));
    }
};
