const ora = require('ora');
const semver = require('semver');
const axios = require('axios');
const npm = require('../../util/npm');

// 安装本地依赖至项目中
module.exports = async (pkgs, flag) => {
    const pkg = pkgs[0];
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
    spinner.succeed(`${pkgName}下载成功`);
};

async function getAvailableVersion(name, spinner) {
    let version = 'latest';
    let type = 'module';
    while (type === 'module') {
        if (version !== 'latest') {
            version = semver.coerce(semver.major(version) - 1).version;
        }
        const res = await axios.get(`https://registry.npmjs.org/${name}/${version}`);
        type = res.data.type;
        if (type === 'module') {
            spinner.text = `检测到当前版本是ESModule类型的，正在向下查找CommonJS版本的V${semver.major(version)}.x`;
        }
        version = res.data.version;
    }
    spinner.text = `正在下载${name}版本V${semver.major(version)}.x`;
    return semver.major(version);
}
