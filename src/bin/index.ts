#!/usr/bin/env node

import commander from 'commander';
import '../util/handleUncaughtError.js';
import logger from '../util/logger.js';
import { isValidKey } from '../util/helper.js';

const program = new commander.Command();
program
  .command('npm <sub-command> [rest...]')
  .option('-D, --dev', '安装到devDependencies')
  .option('-g, --global', '全局操作')
  .option('--open', '打开页面')
  .action(async (subCommand: string, rest, cmd) => {
    const shorthands = {
      i: 'install',
      un: 'uninstall'
    };
    if (isValidKey(subCommand, shorthands)) {
      const target = shorthands[subCommand] || subCommand;
      if (!['install', 'uninstall', 'has', 'search'].includes(target)) {
        logger.error('命令不存在，请重新输入', true);
      }
      const CommandCtor = (await import(`../commands/npm/${target}.js`))
        .default;
      new CommandCtor(rest, cmd).run();
    }
  });
program
  .command('git <sub-command> [rest...]')
  .option('--dir <dir>', '选择安装的目录')
  .option('--open', '在VSCode中打开项目')
  .option('--from <src>', '来源')
  .option('-d, --delete', '删除')
  .option('--commit <msg>', '提交信息')
  .action(async (subCommand = 'index', rest, cmd) => {
    if (subCommand === 'tag') {
      subCommand = 'tag/index';
    }
    if (
      !['clone', 'deploy', 'rename', 'scan', 'tag/index'].includes(subCommand)
    ) {
      logger.error('命令不存在，请重新输入', true);
    }
    const CommandCtor = (await import(`../commands/git/${subCommand}.js`))
      .default;
    new CommandCtor(rest, cmd).run();
  });
program
  .command('agent [sub-command]')
  .option('--proxy <url>', '代理地址')
  .option('--port <num>', '端口号')
  .option('-c, --copy', '复制网络地址')
  .option('--debug', '调试模式')
  .action(async (subCommand, options) => {
    const CommandCtor = (await import(`../commands/agent/index.js`)).default;
    new CommandCtor(subCommand, options).run();
  });
program
  .command('size <url>')
  .option('--rect', '获取宽高')
  .action(async (filename, options) => {
    const SubCommand = (await import('../commands/size.js')).default;
    new SubCommand(filename, options).run();
  });
program
  .command('open <name>')
  .option('--name <name>', '打开的文件夹')
  .action(async (url, cmd) => {
    const SubCommand = (await import('../commands/open.js')).default;
    new SubCommand(url, cmd).run();
  });
program
  .command('occ [data...]')
  .option('--token [token]', '获取token或根据token跳转')
  .option('--pc', '打开PC端')
  .option('--copy', '复制地址')
  .allowUnknownOption()
  .action(async (data, options) => {
    const SubCommand = (await import('../commands/occ.js')).default;
    new SubCommand(data, options).run();
  });
program
  .command('mon [filename]')
  .allowUnknownOption()
  .action(async (file, _, options) => {
    const combinedOptions = options.args.slice(1);
    const SubCommand = (await import('../commands/monitor.js')).default;
    new SubCommand(file, combinedOptions).run();
  });
program
  .command('spider <url>')
  .option('--dest <dest>', '下载目标文件夹')
  .action(async (url, option) => {
    const SubCommand = (await import('../commands/spider/index.js')).default;
    new SubCommand(url, option).run();
  });
program.command('kill <data...>').action(async (data) => {
  const SubCommand = (await import('../commands/kill.js')).default;
  new SubCommand(data).run();
});
program.command('clear <filename>').action(async (filename) => {
  const SubCommand = (await import('../commands/clear.js')).default;
  new SubCommand(filename).run();
});
program.command('upload <filename>').action(async (file) => {
  const SubCommand = (await import('../commands/upload.js')).default;
  new SubCommand(file).run();
});

program.parse();
