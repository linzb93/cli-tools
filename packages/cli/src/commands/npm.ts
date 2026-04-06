import { hasService, type Options as HasOptions } from '@/business/npm/has';
import { uninstallService, type Options as UninstallOptions } from '@/business/npm/uninstall';
import { searchService, type Options as SearchOptions } from '@/business/npm/search';
import { scanService } from '@/business/npm/scan';
import { subCommandCompiler } from '@/utils';

/**
 * npm 命令入口函数
 * @param {string} subCommand - 子命令名称
 */
export const npmCommand = function (subCommand: string, nextCommand?: string): void {
    // 子命令映射表
    if (subCommand === 'has') {
        subCommandCompiler((program) => {
            program
                .command('has <name>')
                .description('检查本地是否安装了指定的 npm 包')
                .option('--dev', '检查 devDependencies')
                .option('--global', '检查全局安装的包')
                .action((name: string, options: HasOptions) => {
                    hasService([name], options);
                });
        });
        return;
    }
    if (subCommand === 'search') {
        subCommandCompiler((program) => {
            program
                .command('search <names...>')
                .description('搜索 npm 包信息')
                .option('--open', '在浏览器中打开包页面')
                .option('--full', '显示完整信息（包含描述）')
                .action((names: string[], options: SearchOptions) => {
                    searchService(names, options);
                });
        });
        return;
    }
    if (subCommand === 'uninstall') {
        subCommandCompiler((program) => {
            program
                .command('uninstall <name>')
                .description('卸载本地 npm 包')
                .option('--global', '卸载全局安装的包')
                .action((name: string, options: UninstallOptions) => {
                    uninstallService([name], options);
                });
        });
        return;
    }
    if (subCommand === 'scan') {
        subCommandCompiler((program) => {
            program
                .command('scan')
                .description('扫描所有项目中指定 npm 包的使用情况')
                .requiredOption('--package <name>', '要扫描的包名')
                .option('--version <versions>', '目标版本，多个用逗号分隔')
                .action((options: { package: string; version?: string }) => {
                    scanService(options.package, options.version);
                });
        });
        return;
    }

    console.log(`未知的 npm 子命令: ${subCommand}`);
    console.log(`可用的子命令: ${['has', 'search', 'uninstall', 'scan'].join(', ')}`);
};
