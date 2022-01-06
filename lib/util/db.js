const fs = require('fs-extra');
const { get: objectGet } = require('lodash');
const path = require('path');
const resolve = src => path.resolve(__dirname, src);

module.exports = key => {
    const data = fs.readJSONSync(resolve('../../config.secret.json'));
    return objectGet(data, key);
};
