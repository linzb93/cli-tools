const chalk = require('chalk');

exports.warn = text => {
    console.log(`${chalk.bgYellow.black(' WARN ')} ${text}`);
};
exports.error = async (text, notEnd) => {
    console.log(`${chalk.bgRed.black(' ERROR ')} ${text}`);
    if (!notEnd) {
        process.exit(1);
    }
};
exports.done = text => {
    console.log(`${chalk.bgGreen.black(' DONE ')} ${text}`);
};
exports.info = text => {
    console.log(`${chalk.bgGray.white(' INFO ')} ${text}`);
};
exports.deprecate = text => {
    console.log(`${chalk.bgYellow.black(' 即将废弃 ')} ${text}`);
};
