#!/usr/bin/env node
const { program } = require('commander');
const logger = require('./lib/logger');

process.on('uncaughtException', e => {
	logger.error(`uncaughtException:
	${e}`);
});
process.on('unhandledRejection', e => {
	logger.error(`unhandledRejection:
	${e}`);
});

program
.command('npm <sub-command> [rest...]')
.option('-D, --dev', '安装到devDependencies')
.action((subCommand, rest, cmd) => {
    require(`./npm/${subCommand}`)(rest, cmd);
});
program
.command('yuque <sub-command> [rest...]')
.action((subCommand, rest) => {
    require(`./yuque/${subCommand}`)(rest);
});
program
.command('server')
.action(() => {
    require('./server');
});
program.parse(process.argv);