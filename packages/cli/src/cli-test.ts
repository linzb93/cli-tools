#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { generateHelpDoc } from '@/utils/helper';
import { iterationCommand } from './commands/iteration';

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
    .command('iteration')
    .description('版本迭代：更新版本号并处理Git工作流')
    .option('--fix', '三级修复版本')
    .option('--version <version>', '指定版本号')
    .action((options) => {
        import('./commands/iteration').then((m) => m.iterationCommand(options));
    });

program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
