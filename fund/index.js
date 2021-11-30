const fs = require('fs-extra');
const logger = require('../lib/logger');
const pMap = require('p-map');
module.exports = async args => {
    const [ command, ...params ] = args;
    if (command === 'create') {
        require('./create')(params);
        return;
    }
    if (command === 'remove') {
        await pMap(params, async fund => {
            await fs.unlink(`fund/data/${fund}.json`);
            logger.done(`${fund}移除成功`);
        });
    }
    if (!command) {
        // 查询收益
        const dirs = await fs.readdir('fund/data');
        if (!dirs.length) {
            return;
        }
    }
};
