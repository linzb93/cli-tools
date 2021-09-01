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
.action((subCommand, rest) => {
    require(`./git/${subCommand}`)(rest);
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
.command('exec <filename> [args]')
.action((filename, args) => {
    require('./exec')(filename, args);
})
program.parse(process.argv);