#!/usr/bin/env node
import { Command } from 'commander';
import globalPkg from '../../../package.json';
import { awesomeCommand } from './commands/awesome';
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
    .command('awesome [command]')
    .description('Search in awesome list')
    .option('--name <keyword>', 'Search keyword')
    .option('--tag <tag>', 'Filter by tag')
    .action((command, options) => {
        awesomeCommand(command, options);
    });

program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
