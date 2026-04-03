import { Command } from 'commander';
import globalPkg from '../../../package.json';
import init from './bootstrap';
import { generateHelpDoc } from '@/utils/helper';

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

// 动态 import 懒加载方式注册所有命令
function registerCommands() {
    // analyse 子命令
    program
        .command('analyse [sub-command] [rest...]')
        .allowUnknownOption()
        .action((subCommand, rest, options) => {
            import('./commands/analyse').then((m) => m.analyseCommand(subCommand, rest, options));
        });

    // cg 命令
    program
        .command('cg [action] [...rest]')
        .option('--realtime', '实时更新')
        .option('-f, --full', '全部')
        .option('--help', '显示帮助文档')
        .action((action, rest, options) => {
            import('./commands/cg').then((m) => m.cgCommand(action, rest, options));
        });

    // clear 命令
    program
        .command('clear [filename]')
        .option('-r, --root', '清理根目录下的')
        .action((filename, options) => {
            import('./commands/clear').then((m) => m.clearCommand(filename, options));
        });

    // cd 命令
    program
        .command('cd [path]')
        .description('记录并跳转目录')
        .action((targetPath) => {
            import('./commands/cd').then((m) => m.cdCommand(targetPath));
        });

    // color 命令
    program
        .command('color [text]')
        .option('--get', '用指定颜色显示文字')
        .action((data, options) => {
            import('./commands/color').then((m) => m.colorCommand(data, options));
        });

    // cookie 命令
    program
        .command('cookie [text]')
        .option('--type <type>', '转换的类型')
        .option('--copy', '复制结果')
        .action((data, options) => {
            import('./commands/cookie').then((m) => m.cookieCommand(data, options));
        });

    // curl 命令
    program
        .command('curl')
        .option('--extra <extra>', '额外的参数')
        .option('--full', '显示全部header')
        .action((options) => {
            import('./commands/curl').then((m) => m.curlCommand(options));
        });

    // eng 命令
    program
        .command('eng [text]')
        .option('-e,--example', '显示范例')
        .option('-c, --clipboard', '读取剪贴板内容')
        .action((text, options) => {
            import('./commands/eng').then((m) => m.engCommand(text, options));
        });

    // fork 命令
    program
        .command('fork [filename]')
        .option('--duration <duration>', '服务等待断联时间（秒）')
        .action((file, options) => {
            import('./commands/fork').then((m) => m.forkCommand(file, options));
        });

    // git 子命令
    program
        .command('git [sub-command] [rest...]')
        .allowUnknownOption()
        .action((subCommand, rest) => {
            import('./commands/git/index').then((m) => m.gitCommand(subCommand, rest));
        });

    // idea 子命令
    program
        .command('idea [sub-command] [rest...]')
        .allowUnknownOption()
        .action((subCommand, rest) => {
            import('./commands/idea').then((m) => m.ideaCommand(subCommand, rest));
        });

    // ip 命令
    program.command('ip [rest...]').action((data) => {
        import('./commands/ip').then((m) => m.ipCommand(data));
    });

    // kill 命令
    program.command('kill [data...]').action((data) => {
        import('./commands/kill').then((m) => m.killCommand(data));
    });

    // npm 子命令
    program
        .command('npm <sub-command>')
        .option('--package <name>', '要扫描的包名')
        .option('--version <versions>', '目标版本，逗号分隔')
        .action((subCommand, options) => {
            import('./commands/npm').then((m) => m.npmCommand(subCommand, [], options));
        });

    // occ 命令
    program
        .command('occ [data...]')
        .option('--token', '获取token')
        .option('--pc', '打开PC端')
        .option('--copy', '复制地址')
        .option('--test', '测试环境')
        .option('--user', '根据token获取用户信息')
        .option('--full', '先获取登录账号的店铺信息')
        .option('--platform <platformName>', '指定平台名称')
        .option('--fix <url>', '补齐完整的登录地址')
        .option('--version <version>', '指定版本号')
        .option('--type <type>', '指定类型')
        .action((data, options) => {
            import('./commands/occ').then((m) => m.occCommand(data, options));
        });

    // ocr 命令
    program
        .command('ocr')
        .option('--url <url>', '图片线上地址')
        .action((options) => {
            import('./commands/ocr').then((m) => m.ocrCommand(options));
        });

    // repl 命令
    program.command('repl').action(() => {
        import('./commands/repl').then((m) => m.replCommand());
    });

    // sass 命令
    program.command('sass').action(() => {
        import('./commands/sass').then((m) => m.sassCommand());
    });

    // server 命令
    program
        .command('server [command]')
        .option('--menu [name]', '菜单名称')
        .option('-o, --open', '打开浏览器')
        .action((command, option) => {
            import('./commands/server').then((m) => m.serverCommand(command, option));
        });

    // shortcut 命令
    program.command('shortcut [name]').action((name) => {
        import('./commands/shortcut').then((m) => m.shortcutCommand(name));
    });

    // size 命令
    program
        .command('size [url]')
        .option('--rect', '获取宽高')
        .action((filename, options) => {
            import('./commands/size').then((m) => m.sizeCommand(filename, options));
        });

    // time 命令
    program.command('time [time]').action((data) => {
        import('./commands/time').then((m) => m.timeCommand(data));
    });

    // token 命令
    program
        .command('token [data]')
        .option('-o --origin', '原始数据')
        .option('-c --complete', '完整数据')
        .action((data, options) => {
            import('./commands/token').then((m) => m.tokenCommand(data, options));
        });

    // tree 命令
    program
        .command('tree [dir]')
        .option('--level <level>', '层级')
        .option('--ignore <dirs>', '添加忽略的文件夹')
        .option('-c, --copy', '复制')
        .option('--comment', '显示注释')
        .option('--help', '显示帮助文档')
        .action((dir, option) => {
            import('./commands/tree').then((m) => m.treeCommand(dir, option));
        });

    // vue 命令
    program
        .command('vue')
        .option('--select', '显示历史列表供选择')
        .option('--skip', '跳过打包阶段，直接启动服务器')
        .action((option) => {
            import('./commands/vue').then((m) => m.vueCommand(option));
        });
}

// 注册所有命令
registerCommands();

program.parse(process.argv.filter((cmd) => ['--debug', '--help'].includes(cmd) === false));
