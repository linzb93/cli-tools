const fs = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const resolve = src => path.resolve(__dirname, src);
const fundUtil = {
    has(code) {
        try {
            fs.accessSync(resolve(`../codes/${code}.json`));
        } catch {
            return false;
        }
        return true;
    },
    get(code, { buyDate }) {
        const data = fs.readJSONSync(resolve(`../codes/${code}.json`));
        const matches = data.history.filter(item => (buyDate ? dayjs(buyDate).isBefore(item.FSRQ) : true));
        return {
            baseInfo: data.baseInfo,
            history: matches,
            lastestPrice: matches.slice(-1)[0].price
        };
    },
    set(code, data) {
        const file = resolve(`../codes/${code}.json`);
        fs.writeJSONSync(file, data);
    },
    updateInfo(code, info) {
        const data = fs.readJSONSync(resolve(`../codes/${code}.json`));
        data.baseInfo = {
            ...data.baseInfo,
            ...info
        };
        fs.writeJSONSync(resolve(`../codes/${code}.json`), data);
    },
    inserthistory(code, dataArg) {
        if (!dataArg.length) {
            return;
        }
        const data = fs.readJSONSync(resolve(`../codes/${code}.json`));
        data.history.push(dataArg);
        fs.writeJSONSync(resolve(`../codes/${code}.json`), data);
    }
};
const settingUtil = {
    get(key) {
        if (key.includes(',')) {
            const segKeys = key.split(',');
            const data = fs.readJSONSync(resolve('../setting.json'));
            return segKeys.reduce((obj, item) => {
                obj[item] = data[item];
                return obj;
            }, {});
        }
        return fs.readJSONSync(resolve('../setting.json'))[key];
    },
    set(key, value) {
        const data = fs.readJSONSync(resolve('../setting.json'));
        if (key === '*') {
            for (const key1 in value) {
                data[key1] = value[key1];
            }
        } else {
            data[key] = value;
        }
        fs.writeJSONSync(resolve('../setting.json'), data);
    }
};
module.exports = {
    fund: fundUtil,
    setting: settingUtil
};
