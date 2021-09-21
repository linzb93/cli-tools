const open = require('open');
const {clidb} = require('./lib/db');
const inquirer = require('inquirer');
const logger = require('./lib/logger');
const fs = require('fs-extra');
const path = require('path');
const {openInEditor} = require('./lib/util');
const {clidb} = require('./lib/db');
module.exports = async (name, option) => {
    if (!option.code) {
        const map = await clidb.get('openMap');
        if (map && map[name]) {
            open(map[name]);
        } else {
            logger.error('目录不存在，请重新输入');
        }
    } else {
        if (name === 'source') {
            const sourceDir = await clidb.get('sourceCodeDir');
            const dirs = await fs.readdir(sourceDir);
            const {source} = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'source',
                    message: '选择要打开的源码',
                    choices: dirs.map(dir => path.basename(dir))
                }
            ]);
            await openInEditor(path.join(sourceDir, source));
            return;
        }
        const code = await clidb.get('code');
        if (code[name]) {
            await openInEditor(code[name]);
        } else {
            logger.error('项目不存在');
        }
    }
}