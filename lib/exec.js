const execa = require('execa');

const parseCommand = str => {
    const arr = [];
    let temp = '';
    let isInQuote = false;
    let i = 0;
    while (i < str.length) {
        if (str[i] !== '"' && str[i] !== '\'' && str[i] !== ' ') {
            temp += str[i];
        } else if (str[i] !== '"' && str[i] !== '\'') {
            if (!isInQuote) {
                arr.push(temp);
                temp = '';
            } else {
                temp += str[i];
            }
        } else {
            isInQuote = !isInQuote;
        }
        i++;
    }
    arr.push(temp);
    return arr;
};
module.exports = (command, option) => {
    const cmd = parseCommand(command);
    const commandName = cmd[0];
    const args = cmd.slice(1);
    return execa(commandName, args, option);
};
