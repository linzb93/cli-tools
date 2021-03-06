const chalk = require('chalk');

module.exports = {
  errorLogger(text) {
    console.log(chalk.red(text));
  },
  successLogger(text) {
    console.log(chalk.green(text));
  },
  warnLogger(text) {
    console.log(chalk.yellow(text));
  },
  cliColumns(table) {
    const col1 = table.map(row => row[0]);
    const col1MaxLength = col1.reduce((max, item) => Math.max(max, item.length), 0);
    return table.map(row => `  ${row[0]}${' '.repeat(col1MaxLength + 10 - row[0].length)}${row[1]}`).join('\n');
  },
  isURL (text) {
    return text.startsWith('http://') || text.startsWith('https://');
  }
}