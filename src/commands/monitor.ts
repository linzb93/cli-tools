import chokidar, { FSWatcher } from 'chokidar';
import { fork, ChildProcess } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import { debounce } from 'lodash';
import fs from 'fs-extra';
import logger from '@/util/logger';

export default async (filename: string | undefined, combinedOptions: string[]) => {
    let watcher: FSWatcher;
    let entryFile: string = '';
    if (filename === undefined) {
        // 监听整个项目
        watcher = chokidar.watch('**/*.js', {
            ignored: 'node_modules/*'
        });
        if (!watcher) {
            logger.error('文件路径不正确，请重新输入');
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
                    logger.error('项目文件夹以index.js作为入口，未检测到index.js');
                    process.exit(0);
                }
                entryFile = `${filename}/index.js`;
            } else if (await fs.pathExists(`${filename}.js`)) {
                watcher = chokidar.watch(`${filename}.js`);
                entryFile = `${filename}.js`;
            } else {
                logger.error('文件路径不正确，请重新输入');
                process.exit(0);
            }
        }
    }
    watcher.on('change', debounce(file => {
        console.log(chalk.green(`${file}更改，node monitor 重启`));
        restartServer();
    }, 500));
    console.log(chalk.green('node monitor 已启动'));
    process.on('SIGINT', () => {
        console.log(chalk.yellow('关闭进程'));
        process.exit(0);
    });
    process.stdin.on('data', data => {
        const str = data.toString().trim().toLowerCase();
        if (str === 'rs') {
            console.log(chalk.green('手动重启 node monitor'));
            restartServer();
        }
    });
    let subProcess: ChildProcess;
    startServer();
    function startServer() {
        subProcess = fork(entryFile, combinedOptions, {
            stdio: [null, 'inherit', null, 'ipc']
        });
        subProcess.stderr.pipe(process.stdout);
        subProcess.on('close', (_, sig) => {
            if (!sig) {
                logger.error('检测到服务器出现错误，已关闭');
                process.exit(0);
            }
        });
    }
    function restartServer() {
        subProcess.kill();
        startServer();
    }
};

