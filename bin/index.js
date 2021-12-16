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
program.version(`mycli ${require('../package').version}`, '-v, --version');
program
    .command('npm <sub-command> [rest...]')
    .option('-D, --dev', '安装到devDependencies')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        const aliases = {
            i: 'install',
            un: 'uninstall'
        };
        const target = aliases[subCommand] || subCommand;
        require(`../npm/${target}`)(rest, cmd);
    });
program
    .command('git [sub-command] [rest...]')
    .option('--dir <dir>', '选择安装的目录')
    .option('--open', '在VSCode中打开项目')
    .option('--copy', '复制结果文本')
    .option('--commit <msg>', '提交信息')
    .allowUnknownOption()
    .action((subCommand = 'index', rest, cmd) => {
        require(`../git/${subCommand}`)(rest, cmd);
    });
program
    .command('agent [sub-command]')
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .option('-c, --copy', '复制网络地址')
    .option('--debug', '调试阶段')
    .allowUnknownOption()
    .action((subCommand, options) => {
        require('../agent')(subCommand, options);
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
    .command('mon [filename]')
    .allowUnknownOption()
    .action(file => {
        require('../monitor')(file);
    });
program
    .command('upload <filename>')
    .action(file => {
        require('../upload')(file);
    });
program
    .command('server')
    .action(() => {
        require('../server')();
    });
program
    .command('test')
    .action(() => { require('../test')(); });
program.parse();
