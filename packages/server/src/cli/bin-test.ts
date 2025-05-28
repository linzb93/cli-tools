#!/usr/bin/env node
import { Command } from 'commander';
import occ from './commands/occ';
// 创建命令行程序
const program = new Command();

// 设置程序基本信息
program.version('1.0.0').description('CLI工具集合');

//**** 请在这里替换需要调试的代码 ****
program
    .command('occ [data...]')
    .option('--token', '获取token')
    .option('--pc', '打开PC端')
    .option('--copy', '复制地址')
    .option('--test', '测试环境')
    .option('--user', '根据token获取用户信息')
    .option('--full', '先获取登录账号的店铺信息')
    .option('--fix <url>', '补齐完整的登录地址')
    .option('--pt <platformName>', '指定平台名称')
    .action((data, options) => {
        occ(data, options);
    });
// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
