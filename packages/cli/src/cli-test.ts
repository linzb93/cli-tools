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
program
    .command('cd [path]')
    .description('记录并跳转目录')
    .option('-d, --delete', '删除历史记录')
    .option('-c, --cwd', '跳转到项目根目录')
    .option('--alias', '为目录设置别名')
    .action((targetPath, options) => {
        import('./commands/cd').then((m) => m.cdCommand(targetPath, options));
    });

program.parse(process.argv.filter((cmd) => ['--help'].includes(cmd) === false));

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
