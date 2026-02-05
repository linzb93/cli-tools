#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { analyseCommand } from './commands/analyse';
// import { logger } from '@cli-tools/shared/utils/logger';
// 创建命令行程序
const program = new Command();
import { generateHelpDoc } from '@cli-tools/shared/utils/helper';
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
                // logger.cli(thisCommand.args.join(' '));
                resolve();
            }
        }, 100);
    });
});
//**** 请在这里替换需要调试的代码 ****
program
    .command('analyse [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, options) => {
        analyseCommand(subCommand, rest, options);
    });
// 解析命令行参数
program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
