#!/usr/bin/env node

// 先处理debug模式
if (process.argv.includes('--debug')) {
    process.env.DEBUG = '*';
}
import { Command } from 'commander';
import ip from './commands/ip';
import open from './commands/open';
import translate from './commands/translate';
import occ from './commands/occ';
import cookie from './commands/cookie';
import agent from './commands/agent';
import cg from './commands/cg';
import clear from './commands/clear';
import color from './commands/color';
import fork from './commands/fork';
import json from './commands/json';
import ai from './commands/ai';
import kill from './commands/kill';
import lixi from './commands/lixi';
// import mock from "./commands/mock";
import shortcut from './commands/shortcut';
import getSize from './commands/size';
import token from './commands/token';
import tree from './commands/tree';
import git from './commands/git';
import npm from './commands/npm';
import analyse from './commands/analyse';
import time from './commands/time';
import repl from './commands/repl';
import server from './commands/server';
import globalPkg from '../../../../../package.json';
import init from '@/service/init';

const program = new Command();
program.version(globalPkg.version);

program.hook('preAction', (thisCommand) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            init(thisCommand);
            resolve();
        }, 500);
    });
});

program
    .command('agent [sub-command]')
    .option('--proxy <url>', '代理地址')
    .option('--port <num>', '端口号')
    .option('-c, --copy', '复制网络地址')
    .option('--help', '显示帮助文档')
    .action((subCommand, options) => {
        agent(subCommand, options);
    });
program
    .command('ai [name]')
    .option('-s, --short', '简单回答')
    .option('-c, --clear', '清理对话')
    .action((action, options) => {
        ai(action, options);
    });
program
    .command('cg [action] [...rest]')
    .option('--realtime', '实时更新')
    .option('-f, --full', '全部')
    .option('--help', '显示帮助文档')
    .action((action, rest, options) => {
        cg(action, rest, options);
    });

program
    .command('clear <filename>')
    .option('-r, --root', '清理根目录下的')
    .option('--help', '显示帮助文档')
    .action((filename, options) => {
        clear(filename, options);
    });

program.command('analyse [sub-command]').action((subCommand) => {
    analyse(subCommand);
});

program
    .command('color <text>')
    .option('--help', '显示帮助文档')
    .option('--get')
    .action((data, options) => {
        color(data, options);
    });
program
    .command('cookie <text>')
    .option('--type <type>', '转换的类型')
    .option('--copy', '复制结果')
    .action((data, options) => {
        cookie(data, options);
    });
program
    .command('eng <text>')
    .option('-e,--example', '显示范例')
    .option('--help', '显示帮助文档')
    .action((text, options) => {
        translate(text, options);
    });

program
    .command('fork <filename>')
    .option('--help', '显示帮助文档')
    .action((file, options) => {
        fork(file, options);
    });

program
    .command('git [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        git(subCommand, rest, cmd);
    });

program
    .command('ip [rest...]')
    .option('--help', '显示帮助文档')
    .action((data, options) => {
        ip(data, options);
    });
program
    .command('json [rest...]')
    .option('--help', '显示帮助文档')
    .option('--same', '复制相同的key')
    .option('--diff', '复制不同的key，空行间隔')
    .option('--diff1', '第一个json不同的key')
    .option('--diff2', '第二个json不同的key')
    .action((data, options) => {
        json(data, options);
    });

program
    .command('kill <data...>')
    .option('--help', '显示帮助文档')
    .action((data, options) => {
        kill(data, options);
    });

program.command('lixi').action(() => {
    lixi();
});

// program
//   .command("mock [action]")
//   .option("--force", "强制更新所有接口并启动服务器")
//   .option("--single [path]", "更新单一接口")
//   .option("--update", "只更新接口")
//   .option("--help", "显示帮助文档")
//   .action((action, options) => {
//     mock(action, options);
//   });

program
    .command('npm [sub-command] [rest...]')
    .option('-D, --dev', '安装到devDependencies')
    .option('-g, --global', '全局操作')
    .option('-f, --full', '完整版')
    .option('--open', '打开页面')
    .option('--cjs', '安装commonjs类型的')
    .option('--help', '显示帮助文档')
    .action((subCommand: string, rest, cmd) => {
        npm(subCommand, rest, cmd);
    });

program
    .command('occ [data...]')
    .option('--token', '获取token')
    .option('--pc', '打开PC端')
    .option('--copy', '复制地址')
    .option('--test', '测试环境')
    .option('--user', '根据token获取用户信息')
    .option('--full', '先获取登录账号的店铺信息')
    .option('--help', '显示帮助文档')
    .option('--fix <url>', '补齐完整的登录地址')
    .action((data, options) => {
        occ(data, options);
    });

program
    .command('open <name>')
    .option('--name <name>', '打开的文件夹')
    .option('-r, --reuse', '强制在已开启的编辑器里打开')
    .option('--help', '显示帮助文档')
    .action((url, cmd) => {
        open(url, cmd);
    });

program.command('repl').action(() => {
    repl();
});

program
    .command('server [command]')
    .option('--menu [name]', '菜单名称')
    .option('-o, --open', '打开浏览器')
    .action((command, option) => {
        server(command, option);
    });

program
    .command('shortcut [name]')
    .option('--help', '显示帮助文档')
    .action((name) => {
        shortcut(name);
    });

program
    .command('size <url>')
    .option('--rect', '获取宽高')
    .option('--help', '显示帮助文档')
    .action((filename, options) => {
        getSize(filename, options);
    });

program.command('time <time>').action((data) => {
    time(data);
});

program
    .command('token <data>')
    .option('-o --origin', '原始数据')
    .option('-c --complete', '完整数据')
    .option('--help', '显示帮助文档')
    .action((data, options) => {
        token(data, options);
    });

program
    .command('tree [dir]')
    .option('--level <level>', '层级')
    .option('--ignore <dirs>', '添加忽略的文件夹')
    .option('-c, --copy', '复制')
    .option('--help', '显示帮助文档')
    .action((dir, option) => {
        tree(dir, option);
    });

program.parse(process.argv.filter((cmd) => cmd !== '--debug'));
