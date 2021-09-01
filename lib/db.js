const fs = require('fs-extra');
const path = require('path');
const resolve = src => path.resolve(__dirname, src);
exports.clidb = {
    get(key) {
        const data = fs.readJSONSync(resolve('../config.secret.json'));
        return data[key];
    }
}