#!/usr/bin/env node

import { Command } from 'commander'; 
import GetSize from '../commands/getSize.js';
import Open from '../commands/open.js';
const program = new Command();

program
    .command('getSize <url>')
    .action(url => {
        // const Command = (await import('../commands/getSize.js')).default;
        new GetSize(url).run();
    });

    program
    .command('open <name>')
    .option('--name <name>')
    .action((url, cmd) => {
        new Open(url, cmd).run();
    });
program.parse();