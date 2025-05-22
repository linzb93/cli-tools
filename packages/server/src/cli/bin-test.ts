#!/usr/bin/env node
import { Command } from 'commander';
import eng from './commands/eng';
import git from './commands/git';
// 创建命令行程序
const program = new Command();

// 设置程序基本信息
program.version('1.0.0').description('CLI工具集合');
program
    .command('eng [text]')
    .option('-e,--example', '显示范例')
    .action((text, options) => {
        eng(text, options);
    });
program
    .command('git [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        git(subCommand, rest, cmd);
    });
// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
