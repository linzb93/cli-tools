import { fork } from 'node:child_process';
import { resolve } from 'node:path';
import chalk from 'chalk';
import fs from 'node:fs';
import internalIp from 'internal-ip';
import type { Message, Options } from './types';
import { logger } from '@/utils/logger';

/**
 * 在子进程中启动服务，退出父进程。
 * 只能用在HTTP服务中，TCP和IPC在父进程退出后也会自动结束
 */
export const forkService = async (filename: string, options: Options) => {
    const cwd = process.cwd();
    // 判断filename是否存在
    if (!fs.existsSync(resolve(cwd, filename))) {
        logger.error(`文件${filename}不存在`);
        return;
    }

    const child = fork(resolve(cwd, filename), {
        cwd,
        detached: true,
        stdio: [null, null, null, 'ipc'],
    });
    child.on('message', async (msgData?: Message) => {
        if (!msgData) {
            console.log('服务器已启动');
        } else {
            const ip = await internalIp.v4();
            console.log(`服务器已启动。${chalk.magenta(`http://${ip}:${msgData.port}`)}`);
        }
        child.unref();
        child.disconnect();
        process.exit(0);
    });
    if (options.duration) {
        setTimeout(() => {
            try {
                console.log(`服务器已启动。`);
                child.unref();
                // child.disconnect();
                process.exit(0);
            } catch (error) {
                //
            }
        }, options.duration * 1000);
    }
};
