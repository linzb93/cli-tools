const git = require('./_internal/git');
const clipboard = require('clipboardy');
const chalk = require('chalk');
const logger = require('../lib/logger');

module.exports = async (_, options) => {
    try {
        const data = await git.remote();
        if (options.copy) {
            clipboard.writeSync(data);
            console.log(`${chalk.green('[已复制]')} ${data}`);
        } else {
            console.log(data);
        }
    } catch (error) {
        logger.error(error.message);
    }
};
