import { resolve } from 'node:path';
import { fork } from 'node:child_process';
import open from 'open';
import dayjs from 'dayjs';
import detectPort from 'detect-port';
import chalk from 'chalk';
import { root } from '@cli-tools/shared/constant/path';
import { killService } from '../kill';
import inquirer from '@/utils/inquirer';
import globalConfig from '../../../../../config.json';
import { sql } from '@cli-tools/shared/utils/sql';
import type { Options } from './types';

const openPage = async (options?: Options) => {
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
};

export const server = async (command?: string, options?: Options) => {
    const port = globalConfig.port.production;
    if (command === 'stop') {
        killService('port', port, {
            log: true,
        });
        return;
    }
    if ((await detectPort(port)) !== port) {
        console.log('服务已启动，无需重新打开');
        await openPage(options);
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
                    }端口启动。`,
                );
                await openPage(options);
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
};
