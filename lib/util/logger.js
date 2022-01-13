const consola = require('consola');
const readline = require('readline');
const StatsLogger = require('../commands/stats/logger');

exports.success = text => {
    consola.success(text);
};

exports.info = text => {
    consola.info(text);
};

exports.warn = text => {
    consola.warn(text);
};

exports.error = text => {
    consola.error(text);
    const logger = new StatsLogger();
    logger.getLastestLog().setError(text);
};

exports.clearConsole = title => {
    if (process.stdout.isTTY) {
        const blank = '\n'.repeat(process.stdout.rows);
        console.log(blank);
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        if (title) {
            console.log(title);
        }
    }
};
