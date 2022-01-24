import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { fork } from 'child_process';
import lodash, { CollectionChain } from 'lodash';
import { db } from './util/index.js';
import Monitor from '../monitor.js';
import BaseCommand from '../../util/BaseCommand.js';
import Stop from './stop.js';

const { pick } = lodash;
interface Options {
    proxy?: string,
    port?: string,
    debug?: boolean,
    copy?: boolean
}
export interface CacheItem {
    proxy: string,
    name: string,
    port?: number
}
interface CacheSaveOption {
    choosed: boolean,
    projName: string
}

export default class extends BaseCommand {
    private subCommand?: string;
    private options: Options;
    constructor(subCommand: string, options: Options) {
        super()
        this.helper.validate(options, {
            proxy: [
                {
                    pattern: /^https?\:/,
                    message: '格式不合法，请输入网址类型的'
                }
            ],
            port: [
                {
                    validator: (_, value) => Number(value) > 1000 || value === undefined,
                    message: '端口号请输入1000以上的整数'
                }
            ]
        });
        this.subCommand = subCommand;
        this.options = options;
    }
    async run() {
        const { subCommand, options } = this;
        if (subCommand === 'stop') {
            new Stop().run();
            return;
        } else if (subCommand !== undefined) {
            this.logger.error('命令不存在，请重新输入');
            return;
        }
        const cacheData = db.get('items').value() as CacheItem[];
        const match = cacheData.find(item => item.proxy === options.proxy);
        if (!match) {
            if (!options.proxy) {
                const { server }: { server: string } = await inquirer.prompt([{
                    message: '请选择要开启的代理服务器',
                    type: 'list',
                    choices: cacheData.map(data => ({
                        name: `${data.name} ${chalk.green(`(${data.proxy})`)}`,
                        value: data.proxy
                    })),
                    name: 'server'
                }]);
                options.proxy = server;
            } else {
                const ans: CacheSaveOption = await inquirer.prompt([
                    {
                        type: 'confirm',
                        message: '是否将服务器数据存入缓存？',
                        name: 'choosed'
                    },
                    {
                        type: 'input',
                        message: '请输入项目名称',
                        name: 'projName',
                        when: answer => answer.choosed
                    }]);
                if (ans.choosed) {
                    (db.get('items') as CollectionChain<CacheItem>).push({
                        name: ans.projName,
                        proxy: options.proxy
                    }).write();
                }
            }
        }
        if (!options.debug) {
            const child = fork(
                path.resolve(this.helper.parseImportUrl(import.meta.url), '../server.js'),
                [...this.helper.processArgvToFlags(pick(options, ['proxy', 'port', 'debug', 'copy'])), '--from-bin=mycli-agent'],
                {
                    cwd: this.helper.root,
                    detached: true,
                    stdio: [null, null, null, 'ipc']
                });
            child.on('message', async ({ port, ip }: { port: string, ip: string }) => {
                console.log(`
    代理服务器已在 ${chalk.yellow(port)} 端口启动：
    - 本地：${chalk.magenta(`http://localhost:${port}/proxy`)}
    - 网络：${chalk.magenta(`http://${ip}:${port}/proxy`)}
    路由映射至：${chalk.cyan(options.proxy)}`);
                const items: CacheItem[] = db.get('items').value();
                const match = items.find(item => item.proxy === options.proxy);
                (match as CacheItem).port = Number(port);
                db.set('items', items).write();
                child.unref();
                child.disconnect();
                process.exit(0);
            });
        } else {
            new Monitor(
                path.resolve(this.helper.parseImportUrl(import.meta.url), '../server.js'),
                (this.helper.processArgvToFlags(pick(options, ['proxy', 'port', 'debug', 'copy'])) as string[])
            ).run();
        }
    };
}

