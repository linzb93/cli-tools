const execa = require('execa');
const fs = require('fs-extra');
const path = require('path');
const del = require('del');
const ora = require('ora');
const { isPath, isURL } = require('../lib/util');
const logger = require('../lib/logger');

module.exports = async (pkgs, flag) => {
    const pkg = pkgs[0];
    if (isPath(pkg)) {
        const pkgConfig = await fs.readJSON(path.resolve(pkg, 'package.json'));
        const targetPath = pkgConfig.name;
        const target = path.resolve('node_modules', targetPath);
        if (await fs.pathExists(target)) {
            await del(target);
        }
        await fs.copy(pkg, target, {
            filter(src) {
                return !src.startsWith(path.resolve(pkg, 'node_modules'));
            }
        });
        const spinner = ora(`正在安装${targetPath}的依赖`);
        const deps = pkgConfig.dependencies || [];
        await execa('cnpm', [ 'install' ].concat(Object.keys(deps)));
        spinner.succeed('依赖安装完成');
    } else if (isURL(pkg)) {
        logger.error('无法识别npm包');
    } else {
        const npmFlag = flag.dev ? '-D' : '-S';
        try {
            execa('cnpm', [ 'install', pkg, npmFlag ]);
        } catch {
            logger.error('无法下载，请检查名称是否有误');
        }
    }
};
