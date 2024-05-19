#!/usr/bin/env node

import * as commander from 'commander';
import handleUncaughtError from '../util/handleUncaughtError.js';
import logger from '../util/logger.js';
import dayjs from 'dayjs';
import { isValidKey, root } from '../util/helper.js';
import path from 'node:path';
import init from '../util/init.js';
import fs from 'fs-extra';
handleUncaughtError();
init();
const program = new commander.Command();
program.version('2.0.0');
program.hook('preAction', (thisCommand) => {
  fs.appendFile(
    path.resolve(root, 'data/track.txt'),
    `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${thisCommand.args.join(' ')}\n`
  );
});
program
  .command('npm [sub-command] [rest...]')
  .option('-D, --dev', '安装到devDependencies')
  .option('-g, --global', '全局操作')
  .option('--open', '打开页面')
  .option('--help', '帮助文档')
  .action(async (subCommand: string, rest, cmd) => {
    const shorthands = {
      i: 'install',
      un: 'uninstall'
    };
    if (!subCommand) {
      const fn = (await import('../commands/npm/index.js')).default;
      fn(cmd);
      return;
    }
    let target = '';
    if (isValidKey(subCommand, shorthands)) {
      target = shorthands[subCommand];
    } else {
      target = subCommand;
    }
    if (!['install', 'uninstall', 'has', 'search'].includes(target)) {
      logger.error('命令不存在，请重新输入', true);
    }
    const func = (await import(`../commands/npm/${target}.js`)).default;
    func(rest, cmd);
  });
program
  .command('git <sub-command> [rest...]')
  .option('--dir <dir>', '选择安装的目录')
  .option('--open', '在VSCode中打开项目')
  .option('--from <src>', '来源')
  .option('-d, --delete', '删除')
  .option('-g, --get', '获取')
  .option('-c, --current', '当前的')
  .option('--commit <msg>', '提交信息')
  .option('--latest', '获取最新版的')
  .option('--type <type>', '类型')
  .option('--tag <name>', 'tag名称')
  .option('-i,--install', '安装')
  .option('--last <len>', '最近几次')
  .option('--debug', '调试模式')
  .action(async (subCommand = 'index', rest, cmd) => {
    if (subCommand === 'tag') {
      subCommand = 'tag/index';
    }
    if (
      ![
        'clone',
        'deploy',
        'rename',
        'scan',
        'reset',
        'remove',
        'pull',
        'push',
        'tag/index'
      ].includes(subCommand)
    ) {
      logger.error('命令不存在，请重新输入', true);
    }
    const func = (await import(`../commands/git/${subCommand}.js`)).default;
    func(rest, cmd);
  });
program
  .command('agent [sub-command]')
  .option('--proxy <url>', '代理地址')
  .option('--port <num>', '端口号')
  .option('-c, --copy', '复制网络地址')
  .option('--debug', '调试模式')
  .action(async (subCommand, options) => {
    const agent = (await import(`../commands/agent/index.js`)).default;
    agent(subCommand, options);
  });
program
  .command('size <url>')
  .option('--rect', '获取宽高')
  .action(async (filename, options) => {
    const getSize = (await import('../commands/size/index.js')).default;
    getSize(filename, options);
  });
program
  .command('open <name>')
  .option('--name <name>', '打开的文件夹')
  .option('-r, --reuse', '强制在已开启的编辑器里打开')
  .action(async (url, cmd) => {
    const open = (await import('../commands/open/index.js')).default;
    open(url, cmd);
  });
program
  .command('occ [data...]')
  .option('--token [token]', '获取token或根据token跳转')
  .option('--pc', '打开PC端')
  .option('--copy', '复制地址')
  .option('--test', '测试环境')
  .option('--user', '根据token获取用户信息')
  .option('--version <v>', '版本')
  .option('--debug', '调试模式')
  .action(async (data, options) => {
    const occ = (await import('../commands/occ/index.js')).default;
    occ(data, options);
  });
program
  .command('mon [filename]')
  .allowUnknownOption()
  .action(async (file, _, options) => {
    const combinedOptions = options.args.slice(1);
    const monitor = (await import('../commands/monitor/index.js')).default;
    monitor(file, combinedOptions);
  });
program
  .command('spider <url>')
  .option('--dest <dest>', '下载目标文件夹')
  .action(async (url, option) => {
    const spider = (await import('../commands/spider/index.js')).default;
    spider(url, option);
  });
program.command('lixi').action(async () => {
  const lixi = (await import('../commands/lixi/index.js')).default;
  lixi();
});
program
  .command('tree [dir]')
  .option('--level <level>', '层级')
  .option('--ignore <dirs>', '添加忽略的文件夹')
  .option('-c, --copy', '复制')
  .action(async (dir, option) => {
    const tree = (await import('../commands/tree/index.js')).default;
    tree(dir, option);
  });
program
  .command('bug [source]')
  .option('--debug', '调试模式')
  .option('-h, --help', '帮助文档')
  .action(async (source, option) => {
    const bug = (await import('../commands/bug/index.js')).default;
    bug(source, option);
  });
program.command('kill <data...>').action(async (data) => {
  const kill = (await import('../commands/kill/index.js')).default;
  kill(data);
});
program
  .command('server')
  .option('--dev', '开发模式')
  .action(async (options) => {
    const server = (await import('../commands/server/index.js')).default;
    server(options);
  });
program.command('clear <filename>').action(async (filename) => {
  const clear = (await import('../commands/clear/index.js')).default;
  clear(filename);
});
program
  .command('cg [action] [...rest]')
  .option('--realtime', '实时更新')
  .option('-f, --full', '全部')
  .option('--debug', '调试')
  .action(async (action, rest, options) => {
    const cg = (await import('../commands/cg/index.js')).default;
    cg(action, rest, options);
  });
program
  .command('token <data>')
  .option('-o --origin', '原始数据')
  .option('-c --complete', '完整数据')
  .action(async (data, options) => {
    const token = (await import('../commands/token/index.js')).default;
    token(data, options);
  });
program
  .command('eng <text>')
  .option('-e,--example', '显示范例')
  .action(async (text, options) => {
    const translate = (await import('../commands/translate/index.js')).default;
    translate(text, options);
  });
program
  .command('color <text>')
  .option('--get')
  .action(async (data, options) => {
    const color = (await import('../commands/color/index.js')).default;
    color(data, options);
  });
program.command('ipc').action(async () => {
  const ipc = (await import('../commands/ipc/index.js')).default;
  ipc();
});
program.command('ip').action(async () => {
  const ip = (await import('../commands/ip/index.js')).default;
  ip();
});
program.command('fork <filename>').action(async (file) => {
  const fork = (await import('../commands/fork/index.js')).default;
  fork(file);
});
program
  .command('mock [action]')
  .option('--force', '强制更新所有接口并启动服务器')
  .option('--single [path]', '更新单一接口')
  .option('--update', '只更新接口')
  .action(async (action, options) => {
    const mock = (await import('../commands/mock/index.js')).default;
    mock(action, options);
  });
program.command('shortcut [name]').action(async (name) => {
  const shortcut = (await import('../commands/shortcut/index.js')).default;
  shortcut(name);
});
program.parse();
