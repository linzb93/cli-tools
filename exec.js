const fs = require('fs-extra');
const logger = require('./lib/logger');
module.exports = async (filename, args) => {
    if (!fs.existsSync(`${filename}.js`)) {
        logger.error('文件不存在！');
        return;
    }
    const target = require(`${process.cwd()}/${filename}.js`);
    let result;
    if (typeof target === 'function') {
        if (args === '') {
            result = target();
        } else {
            result = target(...[args.split(',')]);
        }
    } else {
        if (args.indexOf('(') > 0) {
            const idx = args.indexOf('(');
            const func = args.slice(0, idx);
            if (!target[func]) {
                logger.error('函数不存在');
                return;
            }
            const params = args.match(/\((.+)\)/)[1];
            result = target[func](params);
        } else if (!args.includes('(')) {
            result = target[args]();
        }
    }
    console.log(await result);
}
