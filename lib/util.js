const fs = require('fs-extra');
const execa = require('./exec');
const logger = require('./logger');

exports.cliColumns = table => {
    const col1 = table.map(row => row[0]);
    const col1MaxLength = col1.reduce((max, item) => Math.max(max, item.length), 0);
    return table.map(row => `  ${row[0]}${' '.repeat(col1MaxLength + 10 - row[0].length)}${row[1]}`).join('\n');
};
exports.isURL = text => {
    return text.startsWith('http://') || text.startsWith('https://');
};
exports.isPath = value => {
    return value.startsWith('/') || /[CDEFGHI]\:.+/.test(value) || value.startsWith('./') || value.startsWith('../')
};
exports.openInEditor = async project => {
    try {
        await execa(`code ${project}`);
    } catch (cmdError) {
        try {
            await fs.access(project);
        } catch (accessError) {
            logger.error('项目路径不存在');
            return;
        }       
        logger.error('未检测到有安装VSCode');
    }   
}