#!/usr/bin/env node

import commander from 'commander';
import handleUncaughtError from '../util/handleUncaughtError.js';
import logger from '../util/logger.js';
import { isValidKey } from '../util/helper.js';
import init from '../util/init.js';
handleUncaughtError();
init();
const program = new commander.Command();
program.version('2.0.0');
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
      !['clone', 'deploy', 'rename', 'scan', 'reset', 'tag/index'].includes(
        subCommand
      )
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
    const getSize = (await import('../commands/size.js')).default;
    getSize(filename, options);
  });
program
  .command('vue [data...]')
  .option('-c, --copy', '复制地址')
  .option('-f, --force', '强制覆盖')
  .option('--prod', '生产版')
  .option('--all', '全部')
  .option('--help', '查看帮助文档')
  .action(async (data, options) => {
    const vue = (await import('../commands/vue/index.js')).default;
    vue(data, options);
  });
program
  .command('open <name>')
  .option('--name <name>', '打开的文件夹')
  .action(async (url, cmd) => {
    const open = (await import('../commands/open.js')).default;
    open(url, cmd);
  });
program
  .command('occ [data...]')
  .option('--token [token]', '获取token或根据token跳转')
  .option('--pc', '打开PC端')
  .option('--copy', '复制地址')
  .option('--test', '测试环境')
  .option('--user', '根据token获取用户信息')
  .option('--buyDate <cond>', '订购时间')
  .option('--endDate <cond>', '到期时间')
  .option('--version <v>', '版本')
  .option('--debug', '调试模式')
  .action(async (data, options) => {
    const occ = (await import('../commands/occ.js')).default;
    occ(data, options);
  });
program
  .command('test [data...]')
  .option('-<token>', '获取token或根据token跳转')
  .allowUnknownOption()
  .action(async (data, options) => {
    const test = (await import('../commands/test.js')).default;
    test(data, options);
  });
program
  .command('mon [filename]')
  .allowUnknownOption()
  .action(async (file, _, options) => {
    const combinedOptions = options.args.slice(1);
    const monitor = (await import('../commands/monitor.js')).default;
    monitor(file, combinedOptions);
  });
program
  .command('spider <url>')
  .option('--dest <dest>', '下载目标文件夹')
  .action(async (url, option) => {
    const spider = (await import('../commands/spider.js')).default;
    spider(url, option);
  });
program.command('bug [source]').action(async (source) => {
  const bug = (await import('../commands/bug.js')).default;
  bug(source);
});
program.command('kill <data...>').action(async (data) => {
  const kill = (await import('../commands/kill.js')).default;
  kill(data);
});
program.command('clear <filename>').action(async (filename) => {
  const clear = (await import('../commands/clear.js')).default;
  clear(filename);
});
program
  .command('cg [action] [...rest]')
  .option('--realtime', '实时更新')
  .option('--debug', '调试')
  .option('--publish', '推送')
  .action(async (action, rest, options) => {
    const cg = (await import('../commands/cg/index.js')).default;
    cg(action, rest, options);
  });
program
  .command('token <data>')
  .option('-o --origin', '原始数据')
  .option('-c --complete', '完整数据')
  .action(async (data, options) => {
    const token = (await import('../commands/token.js')).default;
    token(data, options);
  });
program
  .command('eng <text>')
  .option('-e,--example', '显示范例')
  .action(async (text, options) => {
    const translate = (await import('../commands/translate.js')).default;
    translate(text, options);
  });
program
  .command('color <text>')
  .option('--get')
  .action(async (data, options) => {
    const color = (await import('../commands/color.js')).default;
    color(data, options);
  });
program
  .command('upload <filename>')
  .option('-m,--markdown', '复制markdown语法')
  .action(async (file, options) => {
    const upload = (await import('../commands/upload.js')).default;
    upload(file, options);
  });
program.command('ip').action(async () => {
  const ip = (await import('../commands/ip.js')).default;
  ip();
});
program.command('fork <filename>').action(async (file) => {
  const fork = (await import('../commands/fork.js')).default;
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
  const shortcut = (await import('../commands/shortcut.js')).default;
  shortcut(name);
});
program.parse();
