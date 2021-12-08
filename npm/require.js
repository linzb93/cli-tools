const fs = require('fs-extra');
const pFilter = require('p-filter');
const logger = require('../lib/logger');
const npm = require('./_internal/util');

// 检查文件里的依赖是否都已安装
module.exports = async args => {
    const pkgList = [];
    let file;
    try {
        file = await fs.readFile(`${process.cwd()}/${args[0]}.js`, 'utf8');
    } catch (e) {
        logger.error(`文件${args[0]}.js 不存在`);
        return;
    }
    const patt = /require\('([a-z0-9-]+)'\)/g;
    let ret;
    while (ret !== null) {
        ret = patt.exec(file);
        if (ret) {
            pkgList.push(ret[1]);
        }
    }
    const filterList = await pFilter(pkgList, async pkg => {
        const ret = await fs.pathExists(`node_modules/${pkg}`);
        return !ret;
    });
    if (filterList.length === 0) {
        logger.done('没有需要安装的依赖');
    } else {
        logger.error(`${filterList.join(',')} 需要安装`);
        await npm.install(filterList.join(' '), {
            dependencies: true
        });
    }
};
