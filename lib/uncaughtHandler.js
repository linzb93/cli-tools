const {errorLogger} = require('./util');

process.on('uncaughtException', err => {
    errorLogger(err);
    process.exit(0);
});
process.on('uncaughtRejection', err => {
    errorLogger(err);
    process.exit(0);
});