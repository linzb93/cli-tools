#!/usr/bin/env node
const { program } = require('commander');
const logger = require('./lib/logger');
const execa = require('execa');

process.on('uncaughtException', async e => {
    await execa('code', [__dirname]);
	logger.error(`uncaughtException:
	${e}`);
});
process.on('unhandledRejection', async e => {
    await execa('code', [__dirname]);
	logger.error(`unhandledRejection:
	${e.stack}`);
});

program
.command('npm <sub-command> [rest...]')
.option('-D, --dev', '安装到devDependencies')
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
.action(url => {
    require('./open')(url);
});
program
.command('code <name>')
.action(name => {
    require('./code')(name);
});
program
.command('exec <filename> [args]')
.action((filename, args) => {
    require('./exec')(filename, args);
})
program.parse(process.argv);