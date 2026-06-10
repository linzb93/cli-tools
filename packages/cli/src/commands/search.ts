import { subCommandCompiler } from '@/utils/command';

/**
 * search 命令入口函数
 * @param {string} subCommand - 子命令名称
 */
export const searchCommand = function (subCommand: string, nextCommand?: string): void {
    // 子命令映射表
    if (subCommand === 'cmd') {
        subCommandCompiler((program) => {
            program
                .command('cmd')
                .description('查询终端命令')
                .option('--keyword [keyword]', '查询关键词')
                .action((options) => {
                    import('@/business/search/cmd').then((module) => module.searchService(options));
                });
        });
        return;
    }
    if (subCommand === 'shortcut') {
        subCommandCompiler((program) => {
            program
                .command('shortcut')
                .description('查询工具快捷键')
                .action((options) => {
                    import('@/business/search/shortcut').then((module) => module.searchService(options));
                });
        });
        return;
    }

    console.log(`未知的 search 子命令: ${subCommand}`);
    console.log(`可用的子命令: ${['cmd', 'shortcut'].join(', ')}`);
};
