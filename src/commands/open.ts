import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import open from 'open';
import globalNpm from 'global-modules';
import BaseCommand from '../util/BaseCommand.js';
import { openInEditor, getOriginPath } from '../util/helper.js';
import { pLocate } from '../util/pFunc.js';
import getSetting from '../util/db.js';
import logger from '../util/logger.js';

interface Option {
    name: string
}
export default class extends BaseCommand {
    private name: string;
    private options: Option;
    constructor(name: string, options: Option) {
        super();
        this.name = name;
        this.options = options;
    }
    async run() {
        const { name, options } = this;
        if (name === 'source') {
            const sourceDir = getSetting('open.source');
            const dirs = await fs.readdir(sourceDir);
            if (options.name) {
                let matchPath:string;
                try {
                    matchPath = await pLocate([
                        path.join(sourceDir, options.name),
                        path.join(sourceDir, `${options.name}.lnk`)
                    ], async (file: string) => {
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
        await this.makeOpenAction(map, name);
    }
    async makeOpenAction(map: any[], name: string) {
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
}
