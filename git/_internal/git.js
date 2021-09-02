const execa = require('../../lib/exec');

module.exports = {
    async clone({
        url,
        branch,
        dirName,
        shallow = false,
        cwd = process.cwd()
    }) {
        await execa(`git clone${branch ? ` -b ${branch}` : ''} ${url}${dirName ? ` ${dirName}` : ''}${shallow ? ' --depth=1' : ''}`, {
            cwd
        });
        return dirName || url.split('/').slice(-1)[0].slice(0, -4);
    }
};
