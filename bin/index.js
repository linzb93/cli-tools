#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const inquirer = require('inquirer');
const { openInEditor } = require('../lib/util');
const logger = require('../lib/logger');
const path = require('path');
process.on('uncaughtException', async e => {
    logger.error(e.stack, true);
    const ans = await inquirer.prompt([{
        type: 'confirm',
        message: '发现未处理的错误，是否打开编辑器修复bug？',
        name: 'open'
    }]);
    if (ans.open) {
        openInEditor(path.dirname(__dirname));
    }
});
process.on('unhandledRejection', async e => {
    logger.error(e.stack, true);
    if (program.args.includes('--debug') || process.cwd() === path.dirname(__dirname)) {
        process.exit(0);
    }
    const ans = await inquirer.prompt([{
        type: 'confirm',
        message: '发现未处理的异步错误，是否打开编辑器修复bug？',
        name: 'open'
    }]);
    if (ans.open) {
        openInEditor(path.dirname(__dirname));
    }
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
    .option('-c,--code', '在编辑器中打开')
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
