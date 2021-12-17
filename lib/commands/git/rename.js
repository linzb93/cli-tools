// const { command: execa } = require('execa');
const fs = require('fs-extra');
const glob = require('glob');
const chalk = require('chalk');
const path = require('path');
const { camelCase, kebabCase, filter } = require('lodash');
const { pascalCase } = require('pascal-case');
const whiteList = [ 'App.vue', '.otf', '.ttf', '1px.scss', 'README.md' ];
const outputs = [];

// 对所有命名不规范的文件/文件夹，重新命名，并用git mv 更新
module.exports = async () => {
    // 只扫描src文件夹里的
    const files = filter(glob.sync('src/**/*'), file => !whiteList.find(item => file.endsWith(item)));
    files.forEach(file => {
        const stat = fs.statSync(file);
        let filename;
        if (stat.isDirectory()) {
            filename = path.basename(file);
            if (!isCamelCase(filename)) {
                output(camelCase(path.resolve(file, '../', filename)), file);
            }
        } else {
            filename = path.basename(file).split('.')[0];
            const extname = path.extname(file);
            if (extname === '.js') {
                if (isPascalCase(filename)) {
                    //
                } else if (isConfigJS(filename) && !isKebabCase(filename)) {
                    output(kebabCase(path.resolve(file, '../', filename)), file);
                } else if (!isCamelCase(filename)) {
                    output(camelCase(path.resolve(file, '../', filename)), file);
                }
            } else if (extname === '.vue') {
                if (isVuePage(file)) {
                    if (!isCamelCase(filename)) {
                        output(camelCase(path.resolve(file, '../', filename)), file);
                    }
                } else if (!isPascalCase(filename)) {
                    output(pascalCase(path.resolve(file, '../', filename)), file);
                }
            } else {
                if (!isKebabCase(filename)) {
                    output(kebabCase(path.resolve(file, '../', filename)), file);
                }
            }
        }
    });
    outputs.forEach(item => {
        console.log(`${chalk.yellow(item.old)} -> ${chalk.green(item.news)}`);
    });
};
function output(news, old) {
    outputs.push({ news, old });
}
// function transformLogger(str, ...rest) {
//     return `ERROR ${str.replace(/\$[1-9]/g, match => {
//         const index = Number(match.replace('$', ''));
//         return `"${rest[index - 1]}"`;
//     })}\n`;
// }
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
