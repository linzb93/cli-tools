#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../../package.json';
import occ from './commands/occ';
import ai from './commands/ai';
// import { logger } from '@/utils/logger';
// 创建命令行程序
const program = new Command();
import { generateHelpDoc } from '@/utils/helper';
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
            }
        }, 100);
    });
});
//**** 请在这里替换需要调试的代码 ****
program
    .command('ai [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, options) => {
        ai(subCommand, rest, options);
    });
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
    .option('--version <version>', '指定版本')
    .option('--type <type>', '指定类型')
    .action((data, options) => {
        occ(data, options);
    });
// 解析命令行参数
program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

// 如果没有提供任何命令参数，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
