import { fork } from 'node:child_process';
import { resolve } from 'node:path';
import chalk from 'chalk';
import internalIp from 'internal-ip';
import { BaseService } from '@cli-tools/shared/base/BaseService';

interface Message {
    port: string;
}

/**
 * 在子进程中启动服务，退出父进程。
 * 只能用在HTTP服务中，TCP和IPC在父进程退出后也会自动结束
 */
export class ForkService extends BaseService {
    async main(filename: string) {
        const cwd = process.cwd();
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
    }
}
