#!/usr/bin/env node
const fs = require('fs-extra');
const chalk = require('chalk');
const {errorLogger, cliColumns} = require('./lib/util');
const {parser} = require('./lib/command-parser');
require('./lib/uncaughtHandler');

(async () => {
  const {command} = parser();
  
  const commandMap = await fs.readJSON('./command.json');
  if (command === undefined) {
    console.log(`Usage: mycli <command> [options]

Commands:
${cliColumns(commandMap.map(tp => [`${tp.id}`, tp.name]))}

Run ${chalk.cyan(`mycli <command> -h`)} for detailed usage of given command.`);
  } else if (commandMap.find(item => item.id === command)) {
    require(`./${command}`)();
  } else {
    errorLogger('命令输入有误，请重新输入！');
  }
})();