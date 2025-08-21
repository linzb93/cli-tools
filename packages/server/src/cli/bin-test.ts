#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../../package.json';
import curl from './commands/curl';
import git from './commands/git';
// 创建命令行程序
const program = new Command();

// 设置程序基本信息
program.version(globalPkg.version).description('CLI工具集合');

program.hook('preAction', (thisCommand) => {
    return new Promise<void>((resolve) => {
        setTimeout(async () => {
            // 先处理debug模式
            if (process.argv.includes('--debug')) {
                process.env.DEBUG = '*';
                resolve();
            }
            resolve();
        });
    });
});

//**** 请在这里替换需要调试的代码 ****
program
    .command('curl')
    .option('--format <type>', '格式化类型')
    .action((options) => {
        curl(options);
    });
program
    .command('git [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        git(subCommand, rest, cmd);
    });
// 解析命令行参数
program.parse(process.argv.filter((cmd) => ['--debug'].includes(cmd) === false));

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
