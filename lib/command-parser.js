const fs = require('fs-extra');
const path = require('path');
const { errorLogger, cliColumns } = require('./util');

// 命令行参数解析
const parser = isSub => {
  // process.argv从第三项开始才是用户输入相关的
  const num = isSub ? 3 : 2;
  const sentence = process.argv.slice(num);
  if (!sentence.length) {
    return {
      command: undefined
    }
  }
  let errors = '';
  const last = sentence[sentence.length - 1];
  const flag = last.indexOf('-') === 0 ? last.slice(1) : null;
  return {
    command: sentence[0], // 命令
    flag, // 标志
    args: flag ? sentence.slice(1, -1) : sentence.slice(1), // 参数
    errors
  }
}

const subParser = async dirname => {
  const {errors, command, flag, args} = parser(true);
  if (errors) {
    errorLogger(errors);
    return;
  }
  let commandMap;
  try {
    commandMap = await fs.readJSON(path.join(dirname, 'command.json'));
  } catch (e) {
    errorLogger(e);
  }
  if (flag === 'h') {
    const moduleName = dirname.split('\\').slice(-1);
    console.log(`Usage: mycli ${moduleName} <command> [options]

Options:
${cliColumns([['-h', 'output usage information']])}

Commands:
${cliColumns(commandMap.map(item => [`${item.id} ${item.rest || ''}`, item.name]))}`);
    return;
  }
  const matches = commandMap.filter(item => item.id === command);
  if (matches.length) {
    require(path.join(dirname, command))(args, flag);
  } else {
    errorLogger('命令行输入有误，请重新输入！');
  }
}

module.exports = {
  parser,
  subParser
}