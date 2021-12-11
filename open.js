const { clidb } = require('./lib/db');
const inquirer = require('inquirer');
const logger = require('./lib/logger');
const fs = require('fs-extra');
const path = require('path');
const { openInEditor, isWin } = require('./lib/util');
const open = require('open');

module.exports = async name => {
    if (name === 'source') {
        const sourceDir = clidb.get('open.source');
        const dirs = await fs.readdir(sourceDir);
        const { source } = await inquirer.prompt([
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
    if (name === 'test') {
        await openInEditor(await clidb.get('code.tools'));
        return;
    }
    if (name === 'global') {
        const url = isWin ? `${path.resolve(process.env.LOCALAPPDATA, '../Roaming/npm/node_modules')}` : '';
        await open(url);
        return;
    }
    const code = await clidb.get('code');
    if (code[name]) {
        await openInEditor(code[name]);
    } else {
        logger.error('项目不存在');
    }
};
