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
        const matches = data.diagram.filter(item => (buyDate ? dayjs(buyDate).isBefore(item.FSRQ) : true));
        return {
            setting: data.setting,
            baseInfo: data.baseInfo,
            diagram: matches
        };
    },
    set(code, data) {
        const file = resolve(`./data/${code}.json`);
        fs.writeJSONSync(file, data);
    },
    updateInfo(code, info) {
        const data = fs.readJSONSync(resolve(`./data/${code}.json`));
        data.baseInfo = info;
        fs.writeJSONSync(resolve(`./data/${code}.json`), data);
    },
    updateSetting(code, info) {
        const data = fs.readJSONSync(resolve(`./data/${code}.json`));
        data.setting = {
            ...data.setting,
            ...info
        };
        fs.writeJSONSync(resolve(`./data/${code}.json`), data);
    },
    insertDiagram(code, dataArg) {
        if (!dataArg.length) {
            return;
        }
        const data = fs.readJSONSync(resolve(`./data/${code}.json`));
        data.diagram.push(dataArg);
        fs.writeJSONSync(resolve(`./data/${code}.json`), data);
    }
};
const settingUtil = {
    get(key) {
        if (key.includes(',')) {
            const segKeys = key.split(',');
            const data = fs.readJSONSync('fund/setting.json');
            return segKeys.reduce((obj, item) => {
                return {
                    ...obj,
                    item: data[item]
                };
            }, {});
        }
        return fs.readJSONSync('fund/setting.json')[key];
    },
    set(key, value) {
        const data = fs.readJSONSync('fund/setting.json');
        if (key === '*') {
            for (const key1 in value) {
                data[key1] = value[key1];
            }
        } else {
            data[key] = value;
        }
        fs.writeJSONSync('fund/setting.json', data);
    }
};
exports.db = {
    fund: fundUtil,
    setting: settingUtil
};
