const fs = require('fs-extra');
const path = require('path');
const del = require('del');
const ora = require('ora');
const semver = require('semver');
const axios = require('axios');
const { isPath, isURL } = require('../../util');
const consola = require('consola');
const npm = require('../../util/npm');

// 安装本地依赖至项目中
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
        await npm.install(Object.keys(deps));
        spinner.succeed('依赖安装完成');
    } else if (isURL(pkg)) {
        consola.error('无法识别npm包');
    } else {
        const version = await getAvailableVersion(pkg);
        const pkgName = `${pkg}@${version}`;
        try {
            await npm.install(pkgName, {
                dependencies: !flag.dev,
                devDependencies: flag.dev
            });
        } catch {
            consola.error('无法下载，请检查名称是否有误');
            return;
        }
        consola.success('下载成功');
    }
};

async function getAvailableVersion(name) {
    let version = 'latest';
    let type = 'module';
    while (type === 'module') {
        if (version !== 'latest') {
            version = semver.coerce(semver.major(version) - 1).version;
        }
        const res = await axios.get(`https://registry.npmjs.org/${name}/${version}`);
        type = res.data.type;
        version = res.data.version;
    }
    return semver.major(version);
}
