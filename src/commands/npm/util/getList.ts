import fs from 'fs-extra';

const shouldUseYarn = () => {
    try {
        fs.accessSync('yarn.lock');
    } catch {
        return false;
    }
    return true;
};
export default async (name: string) => {
    const dirs = await fs.readdir('node_modules');
    try {
        require(`${process.cwd()}/node_modules/${name}/package.json`);
    } catch (error) {
        return {
            list: [],
            versionList: []
        };
    }
    if (shouldUseYarn()) {
        return {
            list: [name],
            versionList: [getVersion[name]]
        };
    }
    const matches = dirs.filter(dir => dir.startsWith(`_${name.startsWith('@') ? name.replace('/', '_') : name}@`));
    return {
        list: matches,
        versionList: matches.map(item => getVersion(item))
    };
};

export function getVersion(packageName: string) {
    return packageName.match(/@([0-9a-z\.\-]+)@/)[1];
}
