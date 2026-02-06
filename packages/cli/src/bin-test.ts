#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { treeCommand } from './commands/tree';
import { generateHelpDoc } from '@cli-tools/shared/utils/helper';

const program = new Command();
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
    .option('--comment', '显示注释')
    .option('--help', '显示帮助文档')
    .action((dir, option) => {
        treeCommand(dir, option);
    });

program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
