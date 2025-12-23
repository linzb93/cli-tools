#!/usr/bin/env node

import { Command } from 'commander';
import globalPkg from '../../../../package.json';
import init from '@/core/init';
import { generateHelpDoc } from '@/utils/helper';
import ip from './commands/ip';
import ai from './commands/ai';
import eng from './commands/eng';
import occ from './commands/occ';
import cg from './commands/cg';
import cookie from './commands/cookie';
import clear from './commands/clear';
import color from './commands/color';
import fork from './commands/fork';
import kill from './commands/kill';
import lixi from './commands/lixi';
import yapi from './commands/yapi';
// import mock from "./commands/mock";
import curl from './commands/curl';
import shortcut from './commands/shortcut';
import getSize from './commands/size';
import token from './commands/token';
import tree from './commands/tree';
import test from './commands/test';
import git from './commands/git';
// import npm from './commands/npm';
import analyse from './commands/analyse';
import time from './commands/time';
import repl from './commands/repl';
import vue from './commands/vue';
import server from './commands/server';
import sass from './commands/sass';

const program = new Command();
program.version(globalPkg.version);

program.hook('preAction', (thisCommand) => {
    return new Promise<void>((resolve) => {
        setTimeout(async () => {
            // 先处理debug模式
            if (process.argv.includes('--debug')) {
                process.env.DEBUG = '*';
                resolve();
            } else if (process.argv.includes('--help')) {
                (async () => {
                    const mainCommand = process.argv[2];
                    if (['git', 'npm', 'ai'].includes(mainCommand)) {
                        await generateHelpDoc([mainCommand, process.argv[3]]);
                    } else {
                        await generateHelpDoc([mainCommand]);
                    }
                    process.exit(0);
                })();
            } else {
                init(thisCommand).then(resolve);
            }
        }, 100);
    });
});

program
    .command('ai [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, options) => {
        ai(subCommand, rest, options);
    });

program
    .command('analyse [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, options) => {
        analyse(subCommand, rest, options);
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
    .command('clear [filename]')
    .option('-r, --root', '清理根目录下的')
    .action((filename, options) => {
        clear(filename, options);
    });
program
    .command('cg [action] [data]')
    .option('--realtime', '实时更新')
    .option('-f, --full', '全部')
    .option('--help', '显示帮助文档')
    .action((action, data, options) => {
        cg(action, data, options);
    });
program
    .command('color [text]')
    .option('--get')
    .action((data, options) => {
        color(data, options);
    });
program
    .command('cookie [text]')
    .option('--type <type>', '转换的类型')
    .option('--copy', '复制结果')
    .action((data, options) => {
        cookie(data, options);
    });
program
    .command('curl')
    .option('--extra <extra>', '额外的参数')
    .option('--full', '显示全部header')
    .action((options) => {
        curl(options);
    });

program
    .command('eng [text]')
    .option('-e,--example', '显示范例')
    .action((text, options) => {
        eng(text, options);
    });

program.command('fork [filename]').action((file) => {
    fork(file);
});

program
    .command('git [sub-command] [rest...]')
    .allowUnknownOption()
    .action((subCommand, rest, cmd) => {
        git(subCommand, rest, cmd);
    });

program.command('ip [rest...]').action((data) => {
    ip(data);
});

program.command('kill [data...]').action((data) => {
    kill(data);
});

program.command('lixi').action(() => {
    lixi();
});

// program
//   .command("mock [action]")
//   .option("--force", "强制更新所有接口并启动服务器")
//   .option("--single [path]", "更新单一接口")
//   .option("--update", "只更新接口")
//   .action((action, options) => {
//     mock(action, options);
//   });

// program
//     .command('npm [sub-command] [rest...]')
//     .option('-D, --dev', '安装到devDependencies')
//     .option('-g, --global', '全局操作')
//     .option('-f, --full', '完整版')
//     .option('--open', '打开页面')
//     .option('--cjs', '安装commonjs类型的')
//     .action((subCommand: string, rest, cmd) => {
//         npm(subCommand, rest, cmd);
//     });

program
    .command('occ [data...]')
    .option('--token', '获取token')
    .option('--pc', '打开PC端')
    .option('--copy', '复制地址')
    .option('--test', '测试环境')
    .option('--user', '根据token获取用户信息')
    .option('--full', '先获取登录账号的店铺信息')
    .option('--fix <url>', '补齐完整的登录地址')
    .option('--pt <platformName>', '指定平台名称')
    .option('--version <version>', '指定版本')
    .option('--type <type>', '指定类型')
    .action((data, options) => {
        occ(data, options);
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

program.command('shortcut [name]').action((name) => {
    shortcut(name);
});

program
    .command('size [url]')
    .option('--rect', '获取宽高')
    .action((filename, options) => {
        getSize(filename, options);
    });

program.command('time [time]').action((data) => {
    time(data);
});

program
    .command('token [data]')
    .option('-o --origin', '原始数据')
    .option('-c --complete', '完整数据')
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
program.command('test').action((options) => {
    test(options);
});

program.command('sass').action(() => {
    sass();
});

program
    .command('vue')
    .option('--command, <command>', '命令')
    .option('-l, --list', '显示列表')
    .option('-s,--server', '直接启动服务器，不打包')
    .option('-c, --checkoutAndBuild', '切换分支并打包')
    .option('--checkout', '切换分支，打包并启动服务器')
    .option('--current', '在本项目启动服务器')
    .option('--port <port>', '启动的端口号')
    .option('--publicPath <path>', '设置publicPath')
    .action((option) => {
        vue(option);
    });
program
    .command('yapi <url>')
    .description('获取yapi接口文档')
    .action((url) => {
        yapi(url);
    });

program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));
