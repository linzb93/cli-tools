const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./lib/logger');
const {openInEditor} = require('./lib/util');
const {clidb} = require('./lib/db');

module.exports = async name => {
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