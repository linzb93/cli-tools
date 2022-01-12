const fs = require('fs-extra');
const prettier = require('prettier');
const {
    get: objectGet,
    set: objectSet,
    isBoolean
} = require('lodash');
const path = require('path');
const resolve = src => path.resolve(__dirname, src);

function get(key) {
    const data = fs.readJSONSync(resolve('../../config.secret.json'));
    return objectGet(data, key);
}

get.editSetting = (key, value) => {
    const data = fs.readJSONSync(resolve('../../config.secret.json'));
    const originValue = objectGet(data, key);
    if (value === '!' && isBoolean(originValue)) {
        objectSet(data, key, !originValue);
    } else {
        objectSet(data, key, value);
    }
    fs.writeFileSync(resolve('../../config.secret.json'), prettier.format(JSON.stringify(data), {
        parser: 'json'
    }));
};

module.exports = get;
