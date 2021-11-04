const fs = require('fs-extra');
module.exports = () => {
    try {
        fs.accessSync('yarn.lock');
    } catch {
        return false;
    }
    return true;
};
