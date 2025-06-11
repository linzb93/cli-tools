#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../../package.json';
import vue from './commands/vue';

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
    .command('vue')
    .option('--command, <command>', '命令')
    .option('-l, --list', '显示列表')
    .option('-s,--server', '直接启动服务器，不打包')
    .option('-c, --checkoutAndBuild', '切换分支并打包')
    .option('--checkout', '切换分支，打包并启动服务器')
    .option('--current', '在本项目启动服务器')
    .option('--port <port>', '启动的端口号')
    .option('--publicPath <path>', '设置publicPath')
    .action((option) => {
        vue(option);
    });

// 解析命令行参数
program.parse(process.argv.filter((cmd) => ['--debug'].includes(cmd) === false));

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
