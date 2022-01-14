const consola = require('consola');
const readline = require('readline');

[ 'success', 'info', 'warn' ].forEach(type => {
    exports[type] = text => consola[type](text);
});

exports.error = (text, needExit) => {
    consola.error(text);
    if (needExit) {
        process.exit(1);
    }
};

exports.clearConsole = (start = 0) => {
    if (process.stdout.isTTY) {
        const blank = '\n'.repeat(process.stdout.rows);
        console.log(blank);
        readline.cursorTo(process.stdout, 0, start);
        readline.clearScreenDown(process.stdout);
    }
};
