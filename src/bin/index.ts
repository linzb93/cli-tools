#!/usr/bin/env node

import { Command } from 'commander';
const program = new Command();

program
    .command('getSize <url>')
    .action(async url => {
        const SubCommand = (await import('../commands/getSize.js')).default;
        new SubCommand(url).run();
    });

program
    .command('open <name>')
    .option('--name <name>', '打开的对象')
    .action(async (url, cmd) => {
        const SubCommand = (await import('../commands/open.js')).default;
        new SubCommand(url, cmd).run();
    });

    program
    .command('occ [data...]')
    .option('--token', '获取token')
    .option('--pc', '打开PC端')
    .option('--copy', '复制地址')
    .option('--search <params>', '高级搜索')
    .allowUnknownOption()
    .action(async (data, options) => {
        const SubCommand = (await import('../commands/occ.js')).default;
        new SubCommand(data, options).run();
    });

    program
    .command('mon [filename]')
    .allowUnknownOption()
    .action(async (file, _, options) => {
        const combinedOptions = options.args.slice(1);
        const SubCommand = (await import('../commands/monitor.js')).default;
        new SubCommand(file, combinedOptions).run();
    });
    program
    .command('kill [data...]')
    .action(async data => {
        const SubCommand = (await import('../commands/kill.js')).default;
        new SubCommand(data).run();
    });
program.parse();