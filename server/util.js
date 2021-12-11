const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.resolve(__dirname, 'cache.json'));
exports.db = low(adapter);
