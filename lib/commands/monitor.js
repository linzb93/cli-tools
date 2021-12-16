const chokidar = require('chokidar');
const execa = require('execa');
const path = require('path');
const chalk = require('chalk');
const { debounce } = require('lodash');
const fs = require('fs-extra');
module.exports = async (filename, combinedOptions) => {
    let watcher;
    let entryFile = '';
    if (filename === undefined) {
        // 监听整个项目
        watcher = chokidar.watch('**/*.js', {
            ignored: 'node_modules/*'
        });
        if (!watcher) {
            console.log('文件路径不正确，请重新输入');
            process.exit(0);
        }
        entryFile = 'index.js';
    } else {
        if (filename.endsWith('.js')) {
            watcher = chokidar.watch(filename);
            entryFile = filename;
        } else {
            if (await fs.pathExists(filename)) {
                watcher = chokidar.watch(`${filename}/**/*.js`);
                if (!await fs.pathExists(path.resolve(filename, 'index.js'))) {
                    console.log('项目文件夹以index.js作为入口，未检测到index.js');
                    process.exit(0);
                }
                entryFile = `${filename}/index.js`;
            } else if (await fs.pathExists(`${filename}.js`)) {
                watcher = chokidar.watch(`${filename}.js`);
                entryFile = `${filename}.js`;
            } else {
                console.log('文件路径不正确，请重新输入');
                process.exit(0);
            }
        }
    }
    let child;

    startServer();
    child.on('close', (...rest) => {
        console.log('检测到服务器有误');
        console.log(rest);
        process.exit(0);
    });
    watcher.on('change', debounce(() => {
        child.kill();
        startServer();
    }, 500));
    process.on('SIGINT', () => {
        console.log('关闭进程');
        process.exit(0);
    });
    function startServer() {
        console.log(chalk.green('node monitor 已启动'));
        child = execa('node', [ entryFile, ...combinedOptions ], {
            stdio: 'inherit'
        });
    }
};

