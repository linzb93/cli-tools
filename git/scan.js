const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const pMap = require('p-map');
const git = require('./util');
const { clidb } = require('../lib/db');

// 扫描所有工作项目文件夹，有未提交、推送的git就提醒。
module.exports = async () => {
    const openMap = clidb.get('open');
    const outputList = [];
    await pMap([ 'admin', 'tools', 'mt', 'ele', 'print' ], async parentProj => {
        const cur = {
            title: path.basename(openMap[parentProj]),
            children: []
        };
        const dirs = await fs.readdir(openMap[parentProj]);
        await pMap(dirs, async dir => {
            const status = await git.getPushStatus({
                cwd: path.join(openMap[parentProj], dir)
            });
            let str = '';
            if (status === 1) {
                str = `项目${dir} ${chalk.red('未提交')}`;
            } else if (status === 2) {
                str = `项目${dir} ${chalk.yellow('未推送')}`;
            } else if (status === 4) {
                str = `项目${dir} ${chalk.yellow('不在master分支上')}`;
            }
            if (str) {
                cur.children.push(str);
            }
        });
        outputList.push(cur);
    });
    console.log('\n');
    for (const item of outputList) {
        if (!item.children.length) {
            continue;
        }
        console.log(`├─${item.title}`);
        for (const child of item.children) {
            console.log(`|  ├─${child}`);
        }
        console.log('|');
    }
};
