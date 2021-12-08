const chalk = require('chalk');
const logSymbols = require('log-symbols');

exports.warn = text => {
    console.log(logSymbols.warning, text);
};
exports.error = async (text, notEnd) => {
    console.log(logSymbols.error, text);
    if (!notEnd) {
        process.exit(1);
    }
};
exports.done = exports.success = text => {
    console.log(logSymbols.success, text);
};
exports.info = text => {
    console.log(logSymbols.info, text);
};
exports.deprecate = text => {
    console.log(`${chalk.bgYellow.black(' 即将废弃 ')} ${text}`);
};
