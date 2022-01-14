#!/usr/bin/env node

const { Command } = require('commander');
const logger = require('../lib/util/logger');
const chalk = require('chalk');
const handleUncaughtError = require('../lib/util/handleUncaughtError');

handleUncaughtError();

const program = new Command();
program.version(`mycli ${require('../package.json').version}`, '-v, --version');

program
    .command('npm <sub-command> [rest...]')
    .option('-D, --dev', '安装到devDependencies')
    .option('-g, --global', '全局操作')
    .option('--open', '打开页面')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        const shorthands = {
            i: 'install',
            un: 'uninstall'
        };
        const target = shorthands[subCommand] || subCommand;
        try {
            require.resolve(`../lib/commands/npm/${target}`);
        } catch (error) {
            logger.error(`命令 ${chalk.yellow(`mycli git ${target}`)} 不存在`);
            return;
        }
        require(`../lib/commands/npm/${target}`)(rest, cmd);
    });
program
    .command('git [sub-command] [rest...]')
    .option('--dir <dir>', '选择安装的目录')
    .option('--open', '在VSCode中打开项目')
    .option('--from <src>', '来源')
    .option('-d, --delete', '删除')
    .option('--commit <msg>', '提交信息')
    .allowUnknownOption()
    .action((subCommand = 'index', rest, cmd) => {
        try {
            require.resolve(`../lib/commands/git/${subCommand}`);
        } catch (error) {
            logger.error(`命令 ${chalk.yellow(`mycli git ${subCommand}`)} 不存在`);
            return;
        }
        require(`../lib/commands/git/${subCommand}`)(rest, cmd);
    });
program
    .command('agent [sub-command]')
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .option('-c, --copy', '复制网络地址')
    .option('--debug', '调试模式')
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
    .command('occ [data...]')
    .option('--token', '获取token')
    .option('--pc', '打开PC端')
    .option('--copy', '复制地址')
    .option('--search <params>', '高级搜索')
    .allowUnknownOption()
    .action((data, options) => {
        require('../lib/commands/occ')(data, options);
    });
program
    .command('fund <sub-command> [data...]')
    .action((subCommand = 'index', data, options) => {
        try {
            require.resolve(`../lib/commands/fund/${subCommand}`);
        } catch (error) {
            logger.error(`命令 ${chalk.yellow(`mycli fund ${subCommand}`)} 不存在`);
            return;
        }
        require(`../lib/commands/fund/${subCommand}`)(data, options);
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
    .command('spider [url]')
    .option('--dest <dest>', '下载目标文件夹')
    .action((url, option) => {
        require('../lib/commands/spider')(url, option);
    });
program
    .command('test')
    .allowUnknownOption()
    .action(() => {
        require('../lib/commands/test');
    });
program.parse();
