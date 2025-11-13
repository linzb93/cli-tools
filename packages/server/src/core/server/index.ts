import { resolve } from 'node:path';
import { fork } from 'node:child_process';
import open from 'open';
import dayjs from 'dayjs';
import detectPort from 'detect-port';
import chalk from 'chalk';
import BaseCommand from '../BaseCommand';
import { root } from '@/utils/constant';
import Kill from '../kill';
import inquirer from '@/utils/inquirer';
import globalConfig from '../../../../../config.json';

export interface Options {
    /**
     * 打开的菜单
     * 如果为true，则会弹出菜单选择，如果为false，则不会打开菜单。
     * @default false
     * */
    menu?: boolean | string;
    /**
     * 是否自动打开浏览器
     * @default false
     * */
    open?: boolean;
    /**
     * 是否结束进程
     * @default false
     */
    exit?: boolean;
}

export default class extends BaseCommand {
    async main(command?: string, options?: Options) {
        const port = globalConfig.port.production;
        if (command === 'stop') {
            new Kill().main('port', port, {
                log: true,
            });
            return;
        }
        if ((await detectPort(port)) !== port) {
            console.log('服务已启动，无需重新打开');
            await this.openPage(options);
            return;
        }
        const child = fork(resolve(root, 'packages/server/dist/web.js'), [], {
            detached: true,
            stdio: [null, null, null, 'ipc'],
        });
        return new Promise((resolve, reject) => {
            child.on('message', async (msgObj: { type: string; message: string }) => {
                if (msgObj.type === 'message') {
                    console.log(msgObj.message);
                    return;
                }
                if (msgObj.type === 'server-start') {
                    console.log(
                        `${chalk.yellow(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`)} 服务在${
                            globalConfig.port.production
                        }端口启动。`
                    );
                    await this.openPage(options);
                    child.unref();
                    child.disconnect();
                    if (options?.exit) {
                        process.exit(0);
                    }
                    resolve(null);
                }
            });
            child.on('error', (error) => {
                console.log(error);
                reject(error);
                process.exit(1);
            });
        });
    }
    private async openPage(options?: Options) {
        if (options?.open) {
            await open(`http://localhost:${globalConfig.port.production}/${globalConfig.prefix.static}`);
            return;
        }
        if (options?.menu) {
            const menus = await this.sql((db) => db.menus);
            let menu = '';
            if (options.menu === true && menus && menus.length) {
                const { answer } = await inquirer.prompt({
                    type: 'list',
                    name: 'answer',
                    message: '请选择要打开的菜单',
                    choices: menus.map((menu) => ({
                        name: menu.title,
                        value: menu.to,
                    })),
                });
                menu = answer;
            } else {
                menu = options.menu as string;
            }
            await open(`http://localhost:${globalConfig.port.production}/${globalConfig.prefix.static}/#${menu}`);
        }
    }
}
