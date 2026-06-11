#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { generateHelpDoc } from '@/utils/help-doc';

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
// open 命令
program
    .command('open')
    .description('递归浏览目录并打开')
    .option('--type <type>', '打开方式，目前仅支持 vscode')
    .action((options) => {
        import('./commands/open').then((m) => m.openCommand(options));
    });

program.parse(process.argv.filter((cmd) => ['--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
