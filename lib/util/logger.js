const consola = require('consola');
const readline = require('readline');

exports.success = text => {
    consola.success(text);
};

exports.info = text => {
    consola.info(text);
};

exports.warn = text => {
    consola.warn(text);
};

exports.error = (text, needExit) => {
    consola.error(text);
    if (needExit) {
        process.exit(1);
    }
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
