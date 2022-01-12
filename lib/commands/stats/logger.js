const dayjs = require('dayjs');
const fs = require('fs-extra');
const path = require('path');
const dbFile = path.resolve(__dirname, 'db.log');

module.exports = class Logger {
    async insert(info, type = 'SUCCESS') {
        const data = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ${type} ${JSON.stringify(info)}`;
        try {
            await fs.appendFile(dbFile, `\n${data}`);
        } catch (error) {
            await fs.writeFile(dbFile, data);
        }
    }
    getLastestLog() {
        let res;
        try {
            res = fs.readFileSync(dbFile, 'utf8');
        } catch (error) {
            //
        }
        const list = res.split('\n');
        return {
            setError(errorText) {
                const ret = setLog(list.slice(-1)[0], { errorMessage: errorText });
                list[list.length - 1] = ret;
                fs.writeFile(dbFile, list.join('\n'));
            }
        };
    }
};

function setLog(raw, obj) {
    const key = Object.keys(obj)[0];
    return `${raw.slice(0, -1)}, "${key}":"${obj[key]}"}`;
}
