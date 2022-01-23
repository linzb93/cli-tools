import fs from 'fs-extra';
import glob from 'glob';
import chalk from 'chalk';
import { execaCommand as execa } from 'execa';
import path from 'path';
import lodash from 'lodash';
import pMap from 'p-map';
import { pascalCase } from 'pascal-case';
import BaseCommand from '../../util/BaseCommand';
const { camelCase, kebabCase, filter } = lodash;
const whiteList = ['App.vue', '.otf', '.ttf', '1px.scss', 'README.md'];

// 对所有命名不规范的文件/文件夹，重新命名，并用 git mv 更新
export default class extends BaseCommand {
    constructor() {
        super();
    }
    async run() {
        // 只扫描src文件夹里的
        const files = filter(glob.sync('src/**/*'), file => !whiteList.find(item => file.endsWith(item)));
        pMap(files, async file => {
            const stat = fs.statSync(file);
            let filename;
            if (stat.isDirectory()) {
                filename = path.basename(file);
                if (!isCamelCase(filename)) {
                    await doAction(camelCase(path.join(file, '../', filename)), file);
                }
            } else {
                filename = path.basename(file).split('.')[0];
                const extname = path.extname(file);
                // TODO: 要转换的是文件名，不是整个路径
                if (extname === '.js') {
                    if (isPascalCase(filename)) {
                        //
                    } else if (isConfigJS(filename) && !isKebabCase(filename)) {
                        await doAction(path.join(file, '../', `${kebabCase(filename)}.js`), file);
                    } else if (!isCamelCase(filename)) {
                        await doAction(path.join(file, '../', `${camelCase(filename)}.js`), file);
                    }
                } else if (extname === '.vue') {
                    if (isVuePage(file)) {
                        if (!isCamelCase(filename)) {
                            await doAction(path.join(file, '../', `${camelCase(filename)}.vue`), file);
                        }
                    } else if (!isPascalCase(filename)) {
                        await doAction(path.join(file, '../', `${pascalCase(filename)}.vue`), file);
                    }
                } else {
                    if (!isKebabCase(filename)) {
                        await doAction(path.join(file, '../', `${kebabCase(filename)}.${extname}`), file);
                    }
                }
            }
        }, { concurrency: 5 });
        this.logger.success('完成检测与重命名');
    };
}

async function doAction(news, old) {
    console.log(`${chalk.yellow(old)} -> ${chalk.green(news)}`);
    await fs.rename(old, news);
    await execa(`git mv ${old} ${news}`, {
        stdio: 'ignore'
    });
}
function isCamelCase(str) {
    return str === camelCase(str);
}
function isPascalCase(str) {
    return str === pascalCase(str);
}
function isKebabCase(str) {
    return str === kebabCase(str);
}
function isVuePage(file) {
    return !file.startsWith('src/components') &&
        !getInDirectory(file, 'components');
}
function isConfigJS(filename) {
    return filename.endsWith('config.js');
}
function getInDirectory(file, dirname) {
    return file.includes(`/${dirname}/`);
}
