const fs = require('fs-extra');
const shouldUseYarn = () => {
    try {
        fs.accessSync('yarn.lock');
    } catch {
        return false;
    }
    return true;
};
module.exports = async name => {
    const dirs = await fs.readdir('node_modules');
    try {
        require(`${process.cwd()}/node_modules/${name}`);
    } catch (error) {
        return {
            list: [],
            versionList: []
        };
    }
    if (shouldUseYarn()) {
        return {
            list: [ name ],
            versionList: [ getVersion[name] ]
        };
    }
    const matches = dirs.filter(dir => dir.startsWith(`_${name.startsWith('@') ? name.replace('/', '_') : name}@`));
    return {
        list: matches,
        versionList: matches.map(item => getVersion(item))
    };
};

function getVersion(packageName) {
    return packageName.match(/@([0-9a-z\.\-]+)@/)[1];
}
module.exports.getVersion = getVersion;
