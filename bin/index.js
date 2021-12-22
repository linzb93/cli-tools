#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const { errorHandler } = require('../lib/util');
const consola = require('consola');
const chalk = require('chalk');
process.on('uncaughtException', async e => {
    errorHandler(e, program);
});
process.on('unhandledRejection', async e => {
    errorHandler(e, program, {
        async: true
    });
});
program.version(`mycli ${require('../package.json').version}`, '-v, --version');
program
    .command('npm <sub-command> [rest...]')
    .option('-D, --dev', '安装到devDependencies')
    .option('-g, --global', '全局操作')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        const aliases = {
            i: 'install',
            un: 'uninstall'
        };
        const target = aliases[subCommand] || subCommand;
        try {
            require.resolve(`../lib/commands/npm/${target}`);
        } catch (error) {
            consola.error(`命令 ${chalk.yellow(`mycli git ${target}`)} 不存在`);
            return;
        }
        require(`../lib/commands/npm/${target}`)(rest, cmd);
    });
program
    .command('git [sub-command] [rest...]')
    .option('--dir <dir>', '选择安装的目录')
    .option('--open', '在VSCode中打开项目')
    .option('--copy', '复制结果文本')
    .option('--commit <msg>', '提交信息')
    .option('--notSync', '当前分支不与远端同步')
    .allowUnknownOption()
    .action((subCommand = 'index', rest, cmd) => {
        try {
            require.resolve(`../lib/commands/git/${subCommand}`);
        } catch (error) {
            consola.error(`命令 ${chalk.yellow(`mycli git ${subCommand}`)} 不存在`);
            return;
        }
        require(`../lib/commands/git/${subCommand}`)(rest, cmd);
    });
program
    .command('agent [sub-command]')
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .option('-c, --copy', '复制网络地址')
    .option('--debug', '调试阶段')
    .allowUnknownOption()
    .action((subCommand, options) => {
        require('../lib/commands/agent')(subCommand, options);
    });
program
    .command('getSize <url>')
    .action(url => {
        require('../lib/commands/getSize')(url);
    });
program
    .command('open <name>')
    .option('--name <name>')
    .action((url, cmd) => {
        require('../lib/commands/open')(url, cmd);
    });
program
    .command('clear [filename]')
    .action(filename => {
        require('../lib/commands/clear')(filename);
    });
program
    .command('exec <filename> [args]')
    .action((filename, args) => {
        require('../lib/commands/exec')(filename, args);
    });
program
    .command('occ [data...]')
    .option('--token', '获取token')
    .option('--pc', '打开PC端')
    .option('--search <params>', '高级搜索')
    .allowUnknownOption()
    .action((data, options) => {
        require('../lib/commands/occ')(data, options);
    });
program
    .command('fund [data...]')
    .option('--help', '帮助')
    .allowUnknownOption()
    .action((data, options) => {
        require('../lib/commands/fund')(data, options);
    });
program
    .command('mon [filename]')
    .allowUnknownOption()
    .action((file, _, options) => {
        const combinedOptions = options.args.slice(1);
        require('../lib/commands/monitor')(file, combinedOptions);
    });
program
    .command('upload <filename>')
    .action(file => {
        require('../lib/commands/upload')(file);
    });
program
    .command('server')
    .action(() => {
        require('../lib/commands/server')();
    });
program
    .command('kill [data...]')
    .action(data => {
        require('../lib/commands/kill')(data);
    });
program
    .command('test')
    .action(() => {
        require('../lib/commands/test')();
    });
program.parse();
