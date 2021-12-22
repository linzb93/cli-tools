const fs = require('fs-extra');
const path = require('path');
const del = require('del');
const ora = require('ora');
const semver = require('semver');
const axios = require('axios');
const readPkg = require('read-pkg');
const { isPath, isURL } = require('../../util');
const consola = require('consola');
const npm = require('../../util/npm');

// 安装本地依赖至项目中
module.exports = async (pkgs, flag) => {
    const pkg = pkgs[0];
    if (isPath(pkg)) {
        const pkgConfig = await readPkg({
            cwd: pkg
        });
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
        const spinner = ora('正在下载').start();
        const version = await getAvailableVersion(pkg, spinner);
        const pkgName = `${pkg}@${version}`;

        try {
            await npm.install(pkgName, {
                dependencies: !flag.dev,
                devDependencies: flag.dev
            });
        } catch {
            spinner.fail('无法下载，请检查名称是否有误');
            return;
        }
        spinner.succeed('下载成功');
    }
};

async function getAvailableVersion(name, spinner) {
    let version = 'latest';
    let type = 'module';
    while (type === 'module') {
        if (version !== 'latest') {
            version = semver.coerce(semver.major(version) - 1).version;
            spinner.text = `检测到当前版本是ESModule类型的，正在向下查找CommonJS版本的V${semver.major(version)}.x`;
        }
        const res = await axios.get(`https://registry.npmjs.org/${name}/${version}`);
        type = res.data.type;
        version = res.data.version;
    }
    spinner.text = `正在下载${name}版本V${semver.major(version)}.x`;
    return semver.major(version);
}
