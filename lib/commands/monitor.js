const chokidar = require('chokidar');
const execa = require('execa');
const chalk = require('chalk');
const { debounce } = require('lodash');
const fs = require('fs-extra');
module.exports = async filename => {
    let watcher;
    let entryFile = '';
    if (filename === undefined) {
        // 监听整个项目
        watcher = chokidar.watch('**/*.js', {
            ignored: 'node_modules/*'
        });
        entryFile = 'index.js';
    } else {
        if (filename.endsWith('.js')) {
            watcher = chokidar.watch(filename);
            entryFile = filename;
        } else {
            const stat = await fs.stat(filename);
            if (stat.isDirectory()) {
                watcher = chokidar.watch(`${filename}/**/*.js`);
                entryFile = `${filename}/index.js`;
            } else if (stat.isFile()) {
                watcher = chokidar.watch(`${filename}.js`);
                entryFile = `${filename}.js`;
            }
        }
    }
    log();
    let child = execa('node', [ entryFile ], {
        stdio: 'inherit'
    });
    watcher.on('change', debounce(() => {
        child.kill();
        log();
        child = execa('node', [ entryFile ], {
            stdio: 'inherit'
        });
    }, 500));
    process.on('SIGINT', () => {
        console.log('关闭进程');
        process.exit(0);
    });
};

function log() {
    console.log(chalk.green('node monitor 已启动'));
}
