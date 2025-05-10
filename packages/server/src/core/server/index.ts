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
import sql from '@/utils/sql';

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
        console.log('正在启动服务器');
        const child = fork(resolve(root, 'packages/server/dist/web.js'), [], {
            detached: true,
            stdio: [null, null, null, 'ipc'],
        });
        child.on('message', async (msgData: any) => {
            if (msgData.type === 'message') {
                console.log(msgData.message);
                return;
            }
            if (msgData.type === 'quit') {
                console.log(
                    `${chalk.yellow(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`)} 服务在${
                        globalConfig.port.production
                    }端口启动。`
                );
                await this.openPage(options);
                child.unref();
                child.disconnect();
                process.exit(0);
            }
        });
        child.on('error', (error) => {
            console.log(error);
            process.exit(1);
        });
    }
    private async openPage(options?: Options) {
        if (options?.open) {
            await open(`http://localhost:${globalConfig.port.production}/${globalConfig.prefix.static}`);
            return;
        }
        if (options?.menu) {
            const menus = await sql((db) => db.menus);
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
