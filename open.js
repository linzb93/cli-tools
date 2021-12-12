const { clidb } = require('./lib/db');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { openInEditor, isWin, getOriginPath, pLocate } = require('./lib/util');
const open = require('open');
const logger = require('./lib/logger');

module.exports = async (name, options) => {
    if (name === 'source') {
        const sourceDir = clidb.get('open.source');
        const dirs = await fs.readdir(sourceDir);
        if (options.name) {
            let matchPath;
            try {
                matchPath = await pLocate([
                    path.join(sourceDir, options.name),
                    path.join(sourceDir, `${options.name}.lnk`)
                ], async file => {
                    try {
                        await fs.access(file);
                    } catch (error) {
                        throw error;
                    }
                    return file;
                });
            } catch (error) {
                logger.error('项目不存在');
                return;
            }
            const path2 = await getOriginPath(matchPath);
            await openInEditor(path2);
        } else {
            const { source } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'source',
                    message: '选择要打开的源码',
                    choices: dirs.map(dir => path.basename(dir))
                }
            ]);
            console.log(path.join(sourceDir, source));
            const path2 = await getOriginPath(path.join(sourceDir, source));
            await openInEditor(path2);
        }
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
};
