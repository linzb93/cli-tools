#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { occCommand } from './commands/occ';
import { generateHelpDoc } from '@/utils/helper';

const program = new Command();
program.version(globalPkg.version).description('CLI工具集合');

program.hook('preAction', () => {
    return new Promise<void>((resolve) => {
        setTimeout(async () => {
            if (process.argv.includes('--help')) {
                (async () => {
                    const mainCommand = process.argv[2];
                    await generateHelpDoc([mainCommand, process.argv[3], process.argv[4]]);
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
        occCommand(data, options);
    });

program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
