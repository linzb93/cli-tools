#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../../package.json';
import yapi from './commands/yapi';
// 创建命令行程序
const program = new Command();

// 设置程序基本信息
program.version(globalPkg.version).description('CLI工具集合');

program.hook('preAction', () => {
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
    .command('yapi <url>')
    .description('获取yapi接口文档')
    .action((url) => {
        yapi(url);
    });
// 解析命令行参数
program.parse(process.argv.filter((cmd) => ['--debug'].includes(cmd) === false));

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
