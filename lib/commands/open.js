const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const open = require('open');
const globalNpm = require('global-modules');
const { openInEditor, getOriginPath } = require('../util');
const { pLocate } = require('../util/pFunc');
const getSetting = require('../util/db');
const logger = require('../util/logger');

module.exports = async (name, options) => {
    if (name === 'source') {
        const sourceDir = getSetting('open.source');
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
    const map = [
        {
            name: 'test',
            setting: 'code.tools',
            isEditor: true
        },
        {
            name: 'cli',
            setting: 'code.cli',
            isEditor: true
        },
        {
            name: 'global',
            target: globalNpm,
            isEditor: true
        }
    ];
    await makeOpenAction(map, name);
};

async function makeOpenAction(map, name) {
    const match = map.find(item => item.name === name);
    if (!match) {
        logger.error('命令错误');
        return;
    }
    if (match.setting && match.isEditor) {
        await openInEditor(getSetting(match.setting));
    } else if (match.target) {
        await open(match.target);
    }
}
