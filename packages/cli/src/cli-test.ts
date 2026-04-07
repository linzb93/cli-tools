#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
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
// minimax 命令
program
    .command('minimax')
    .option('--watch', '是否开启监控模式')
    .action((options) => {
        import('./commands/minimax').then((m) => m.minimaxCommand(options));
    });

program.parse(process.argv.filter((cmd) => ['--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
