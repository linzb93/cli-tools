const clipboard = require('clipboardy');
const chalk = require('chalk');
const consola = require('consola');
const git = require('../../util/git');

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
        consola.error(error.message);
    }
};
