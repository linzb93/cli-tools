const { clidb } = require('./lib/db');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { openInEditor, isWin, getOriginPath } = require('./lib/util');
const open = require('open');
const logger = require('./lib/logger');
const pLocate = require('p-locate');
module.exports = async (name, options) => {
    if (name === 'source') {
        const sourceDir = clidb.get('open.source');
        const dirs = await fs.readdir(sourceDir);
        if (options.name) {
            let matchPath;
            // todo: pLocate不符合需求，应该是获取第一个resolve的结果
            try {
                matchPath = await pLocate([
                    path.join(sourceDir, options.name),
                    path.join(sourceDir, `${options.name}.lnk`)
                ], async file => {
                    try {
                        await fs.access(file);
                    } catch (error) {
                        return false;
                    }
                    return file;
                });
                console.log(matchPath);
            } catch (error) {
                console.log(error);
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
