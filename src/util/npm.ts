import { execaCommand as execa } from 'execa';
import lodash from 'lodash';
const { memoize, isPlainObject } = lodash;

let npmBin = '';
const getNpmBin = memoize(async () => {
    if (npmBin) {
        return npmBin;
    }
    try {
        await execa('cnpm');
        npmBin = 'cnpm';
        return 'cnpm';
    } catch (e) {
        npmBin = 'npm';
        return 'npm';
    }
});

/**
 * npm public API: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 * or cnpm: https://registry.npmmirror.com/ 版本号支持缩写
 */
interface InstallOptions {
    devDependencies?: boolean
    dependencies?: boolean
    global?: boolean
}
function install(name: string):void
function install(name: string, options: InstallOptions):void
function install(options: InstallOptions):void
async function install(...args:any[]) {
    let pkgName = '';
    let options: InstallOptions;
    if (args.length === 1) {
        if (isPlainObject(args[0])) {
            options = args[0];
        } else if (typeof args[0] === 'string') {
            pkgName = args[0];
        }
    } else if (args.length === 2) {
        pkgName = args[0];
        options = args[1];
    }
    const { devDependencies, dependencies, global: optGlobal, ...restOpts } = options;
    const bin = await getNpmBin();
    const params = ['install'];
    if (pkgName) {
        params.push(pkgName);
        if (dependencies) {
            params.push('-S');
        } else if (devDependencies) {
            params.push('-D');
        } else if (optGlobal) {
            params.push('-g');
        }
    }
    return execa(`${bin} ${params.join(' ')}`, restOpts);
}

const npm = {
    install
};
export default npm;