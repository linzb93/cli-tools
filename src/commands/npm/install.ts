import ora from 'ora';
import semver from 'semver';
import axios from 'axios';
import npm from '../../util/npm';
import BaseCommand from '../../util/BaseCommand';

// 安装本地依赖至项目中
export default class extends BaseCommand {
    private pkgs:any;
    private flag:any;
    constructor(pkgs, flag) {
        super()
        this.pkgs = pkgs;
        this.flag=flag;
    }
    async run() {
        const {pkgs, flag} = this;
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
}

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
