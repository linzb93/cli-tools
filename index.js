#!/usr/bin/env node
const { program } = require('commander');
const logger = require('./lib/logger');

process.on('uncaughtException', e => {
    logger.error(`uncaughtException:
	${e}`);
});
process.on('unhandledRejection', e => {
    logger.error(`unhandledRejection:
	${e.stack}`);
});

program
    .command('npm <sub-command> [rest...]')
    .option('-D, --dev', '安装到devDependencies')
    .option('-v, --version', '获取依赖的版本号')
    .action((subCommand, rest, cmd) => {
        const aliases = {
            i: 'install'
        };
        const target = aliases[subCommand] || subCommand;
        require(`./npm/${target}`)(rest, cmd);
    });
program
    .command('yuque <sub-command> [rest...]')
    .action((subCommand, rest) => {
        require(`./yuque/${subCommand}`)(rest);
    });
program
    .command('git <sub-command> [rest...]')
    .option('--dir <dir>', '选择安装的目录')
    .option('--open', '在VSCode中打开项目')
    .action((subCommand, rest, cmd) => {
        require(`./git/${subCommand}`)(rest, cmd);
    });
program
    .command('server')
    .action(() => {
        require('./server');
    });
program
    .command('getSize <url>')
    .action(url => {
        require('./getSize')(url);
    });
program
    .command('open <name>')
    .option('-c,--code', '在编辑器中打开')
    .action((url, cmd) => {
        require('./open')(url, cmd);
    });
program
    .command('clear <filename>')
    .action(filename => {
        require('./clear')(filename);
    });
program
    .command('exec <filename> [args]')
    .action((filename, args) => {
        require('./exec')(filename, args);
    });
program.parse();
