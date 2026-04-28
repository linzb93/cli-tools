import { subCommandCompiler } from '@/utils';
import type { Options } from '@/business/claudeCode/dialog';
/**
 * claudeCode 命令入口函数
 * @param {string} subCommand - 子命令名称
 */
export const claudeCodeCommand = function (subCommand: string): void {
    if (subCommand === 'dialog') {
        subCommandCompiler((program) => {
            program
                .command('dialog <message>')
                .description('显示消息弹窗')
                .option('-t, --title <title>', '弹窗标题', '温馨提醒')
                .action((message: string, options: Options) => {
                    import('@/business/claudeCode/dialog/index').then((module) =>
                        module.dialogService(message, options),
                    );
                });
        });
        return;
    }

    console.log(`未知的 claudeCode 子命令: ${subCommand}`);
    console.log(`可用的子命令: ${['dialog'].join(', ')}`);
};
