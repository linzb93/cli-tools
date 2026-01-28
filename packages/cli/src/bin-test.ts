#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { treeCommand } from './commands/tree';
// import { logger } from '@/utils/logger';
// 创建命令行程序
const program = new Command();
import { generateHelpDoc } from '@cli-tools/shared/src/utils/helper';
// 设置程序基本信息
program.version(globalPkg.version).description('CLI工具集合');
program.hook('preAction', (thisCommand) => {
    return new Promise<void>((resolve) => {
        setTimeout(async () => {
            if (process.argv.includes('--help')) {
                (async () => {
                    const mainCommand = process.argv[2];
                    await generateHelpDoc([mainCommand, process.argv[3]]);
                    process.exit(0);
                })();
            } else {
                resolve();
            }
        }, 100);
    });
});
//**** 请在这里替换需要调试的代码 ****
program
    .command('tree [dir]')
    .option('--level <level>', '层级')
    .option('--ignore <dirs>', '添加忽略的文件夹')
    .option('-c, --copy', '复制')
    .option('--help', '显示帮助文档')
    .action((dir, option) => {
        treeCommand(dir, option);
    });
// 解析命令行参数
program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
