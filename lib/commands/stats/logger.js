const dayjs = require('dayjs');
const fs = require('fs-extra');
const path = require('path');
const dbFile = path.resolve(__dirname, 'db.json');
class Logger {
    constructor() {}
    async insert(type, info) {
        let str;
        try {
            str = await fs.readFile(dbFile);
        } catch (error) {
            await fs.writeFile(dbFile, '');
            str = '';
        }
        const logs = str.split('\n');
        const data = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ${type} [${info.parentCommand} ${JSON.stringify(info)}]`;
        if (logs.length === 0) {
            await fs.writeFile(dbFile, data);
        } else {
            await fs.appendFile(dbFile, data);
        }
    }
    getLastestLog() {}
}
