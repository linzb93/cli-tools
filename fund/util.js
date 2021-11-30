const fs = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const resolve = src => path.resolve(__dirname, src);
const fundUtil = {
    has(code) {
        try {
            fs.accessSync(resolve(`./data/${code}.json`));
        } catch {
            return false;
        }
        return true;
    },
    get(code, options) {
        const buyDate = options ? options.buyDate : undefined;
        const data = fs.readJSONSync(resolve(`./data/${code}.json`));
        const matches = data.netWorth.filter(item => (buyDate ? dayjs(buyDate).isBefore(item.FSRQ) : true));
        return {
            detail: data.detail,
            netWorth: matches
        };
    },
    set(code, data) {
        const file = resolve(`./data/${code}.json`);
        fs.writeJSONSync(file, data);
    },
    updateInfo(code, info) {
        const data = fs.readJSONSync(resolve(`./data/${code}.json`));
        data.detail = info;
        fs.writeJSONSync(resolve(`./data/${code}.json`), data);
    },
    insertNetWorth(code, dataArg) {
        if (!dataArg.length) {
            return;
        }
        const data = fs.readJSONSync(resolve(`./data/${code}.json`));
        data.netWorth.push(dataArg);
        fs.writeJSONSync(resolve(`./data/${code}.json`), data);
    }
};

exports.db = {
    fund: fundUtil
};
