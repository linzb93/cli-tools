#!/usr/bin/env node

import { Command } from 'commander';
import logger from '../util/logger';
const program = new Command();

program
    .command('git [sub-command] [rest...]')
    .option('--dir <dir>', '选择安装的目录')
    .option('--open', '在VSCode中打开项目')
    .option('--from <src>', '来源')
    .option('-d, --delete', '删除')
    .option('--commit <msg>', '提交信息')
    .allowUnknownOption()
    .action(async (subCommand = 'index', rest, cmd) => {
        // try {
        //     require.resolve(`../lib/commands/git/${subCommand}`);
        // } catch (error) {
        //     logger.error(`命令 ${chalk.yellow(`mycli git ${subCommand}`)} 不存在`);
        //     return;
        // }
        if (subCommand === 'tag') {
            subCommand = 'tag/index';
        }
        const CommandCtor = (await import(`../commands/git/${subCommand}.js`)).default;
        new CommandCtor(rest, cmd).run();
    });
program
    .command('agent [sub-command]')
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .option('-c, --copy', '复制网络地址')
    .option('--debug', '调试模式')
    .action(async (subCommand, options) => {
        const CommandCtor = (await import(`../commands/agent/index.js`)).default;
        new CommandCtor(subCommand, options).run();
    });
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