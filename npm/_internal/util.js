const runscript = require('runscript');
const { memoize, isPlainObject } = require('lodash');

let npmBin = '';
const getNpmBin = memoize(async () => {
    if (npmBin) {
        return npmBin;
    }
    try {
        await runscript('cnpm');
        npmBin = 'cnpm';
        return 'cnpm';
    } catch (e) {
        npmBin = 'npm';
        return 'npm';
    }
});

module.exports = {
    async install(...args) {
        let pkgName = '';
        let options = {};
        if (args.length === 1 && isPlainObject(args[0])) {
            options = args[0];
        } else if (args.length === 2) {
            pkgName = args[0];
            options = args[1];
        }
        const { devDependencies, dependencies, global: optGlobal, ...restOpts } = options;
        const bin = await getNpmBin();
        const params = [ 'install' ];
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
        return runscript(`${bin} ${params.join(' ')}`, restOpts);
    },
    async update(name, options) {
        const { global: globalOpt, ...restOpts } = options;
        const bin = await getNpmBin();
        const params = [ 'update', name ];
        if (globalOpt) {
            params.push('-g');
        }
        return runscript(`${bin} ${params.join(' ')}`, restOpts);
    },
    async outdated(name) {
        const bin = await getNpmBin();
        const { data } = await runscript(`${bin} outdated ${name} --json`);
        const ret = JSON.parse(data.toString())[name];
        return {
            isOutdated: ret.current === ret.latest,
            latest: ret.latest,
            current: ret.current
        };
    }
};
