const { sleep } = require('./lib/util');
const { createRequire } = require('module');
const npm = require('./npm/_internal/util');
const path = require('path');
async function requireDynamic(moduleName) {
    try {
        return require(moduleName);
    } catch {
        await npm.install(moduleName);
        // const counter = 0;
        await sleep(1000);
        return createRequire(path.resolve(__dirname, 'package.json'))(moduleName);
    }
}

module.exports = async () => {
    const doomfist = await requireDynamic('doomfist');
    doomfist();
};
