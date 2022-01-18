import runscript from 'runscript';
import inquirer from 'inquirer';
const logger = require('../../util/logger');
import { db } from './util';
const kill = require('../kill');
const { isWin, splitByLine } = require('../../util');
import BaseCommand from '@/util/BaseCommand.js';

export default class extends BaseCommand {
    constructor() {
        super();
    }
    async run () {
        const command = isWin ?
            'wmic Path win32_process Where "Name = \'node.exe\'" Get CommandLine,ProcessId' :
            'ps -eo "pid,args"';
        db
            .defaults({ items: [] })
            .write();
        const cacheData = db.get('items').value();
        const { stdout } = await runscript(command, { stdio: 'pipe' });
        const list = splitByLine(stdout.toString());
        const arr = list
            .filter(item => item.includes('--from-bin=mycli-agent'))
            .map(item => {
                // 未兼容macOS。
                const pid = item.match(/([0-9]+)\s+\r\r$/)[1];
                const proxy = item.match(/--proxy=(\S+)/)[1];
                const match = cacheData.find(cache => cache.proxy === proxy);
                if (match) {
                    return {
                        pid,
                        proxy,
                        name: match.name
                    };
                }
                return {
                    pid,
                    proxy
                };
            });
        if (!arr.length) {
            logger.info('没有要关闭的进程');
            return;
        }
        const { pids } = await inquirer.prompt([{
            type: 'checkbox',
            message: '请选择要关闭的进程',
            name: 'pids',
            choices: arr.map(item => ({
                name: `${item.name || ''}(pid:${item.pid})`,
                value: item.pid
            }))
        }]);
        for (const pid of pids) {
            await kill(`pid ${pid}`);
        }
        logger.success('操作成功');
    };
    
}