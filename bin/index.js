#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const { errorHandler } = require('../lib/util');

process.on('uncaughtException', async e => {
    errorHandler(e, program);
});
process.on('unhandledRejection', async e => {
    errorHandler(e, program, {
        async: true
    });
});

program
    .command('npm <sub-command> [rest...]')
    .option('-D, --dev', '安装到devDependencies')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        const aliases = {
            i: 'install'
        };
        const target = aliases[subCommand] || subCommand;
        require(`../npm/${target}`)(rest, cmd);
    });
program
    .command('yuque <sub-command> [rest...]')
    .action((subCommand, rest) => {
        require(`../yuque/${subCommand}`)(rest);
    });
program
    .command('git [sub-command] [rest...]')
    .option('--dir <dir>', '选择安装的目录')
    .option('--open', '在VSCode中打开项目')
    .option('--copy', '复制结果文本')
    .allowUnknownOption()
    .action((subCommand = 'index', rest, cmd) => {
        require(`../git/${subCommand}`)(rest, cmd);
    });
program
    .command('server [sub-command]')
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .option('-c, --copy', '复制网络地址')
    .allowUnknownOption()
    .action((subCommand, options) => {
        require('../server')(subCommand, options);
    });
program
    .command('getSize <url>')
    .action(url => {
        require('../getSize')(url);
    });
program
    .command('open <name>')
    .option('--name <name>')
    .action((url, cmd) => {
        require('../open')(url, cmd);
    });
program
    .command('clear <filename>')
    .action(filename => {
        require('../clear')(filename);
    });
program
    .command('exec <filename> [args]')
    .action((filename, args) => {
        require('../exec')(filename, args);
    });
program
    .command('occ [data...]')
    .option('--token', '获取token')
    .option('--pc', '打开PC端')
    .option('--search <params>', '高级搜索')
    .allowUnknownOption()
    .action((data, options) => {
        require('../occ')(data, options);
    });
program
    .command('fund [data...]')
    .option('--help', '帮助')
    .allowUnknownOption()
    .action((data, options) => {
        require('../fund')(data, options);
    });
program
    .command('mon <filename>')
    .allowUnknownOption()
    .action(file => {
        require('../monitor')(file);
    });
program
    .command('upload <filename>')
    .action(file => {
        require('../upload')(file);
    });
program.parse();
