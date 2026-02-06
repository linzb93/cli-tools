#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { colorCommand } from './commands/color';
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
    .command('color [text]')
    .option('--get', '用指定颜色显示文字')
    .action((data, options) => {
        colorCommand(data, options);
    });

program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
