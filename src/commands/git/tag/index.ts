import clipboard from 'clipboardy';
import chalk from 'chalk';
import git from '@/util/git';
import BaseCommand from '@/util/BaseCommand.js';

export default class extends BaseCommand {
    private params:any[]
    constructor(...params) {
        super();
        this.params = params;
    }
    async run () {
        const {params} = this;
        const options = params.length === 2 ? params[1] : params[0];
        if (options.delete) {
            require('./delete')();
        }
        const tags = await git.tag();
        const last = tags[tags.length - 1];
        const ret = versionInc(last);
        if (options.silent) {
            return ret;
        }
        if (ret) {
            this.logger.success(`${chalk.green('[已复制]')}新的tag：${ret}`);
            clipboard.write(ret);
        } else {
            this.logger.info(`上一个版本是${last}，请自行命名新tag`);
        }
    }
}

function versionInc(version) {
    if (!version.startsWith('v')) {
        return false;
    }
    const versionNum = version.slice(1);
    if (!/[1-9\.][0-9\.]{1,2}[1-9]/.test(versionNum)) {
        return false;
    }
    const versionNumSeg = versionNum.split('.');
    if (versionNumSeg.length === 3) {
        return `v${versionNum}.1`;
    } else if (versionNumSeg.length === 4) {
        return `v${versionNumSeg.map((n, index) => (index === versionNumSeg.length - 1 ? Number(n) + 1 : n)).join('.')}`;
    }
    return false;
}
