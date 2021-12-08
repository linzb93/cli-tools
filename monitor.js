const chokidar = require('chokidar');
const execa = require('execa');
const chalk = require('chalk');
const { debounce } = require('lodash');
module.exports = async filename => {
    const file = filename.endsWith('.js') ? filename : `${filename}.js`;
    log();
    let child = execa('node', [ file ], {
        stdio: 'inherit'
    });
    const watcher = chokidar.watch(file);
    watcher.on('change', debounce(() => {
        child.kill();
        log();
        child = execa('node', [ file ], {
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
