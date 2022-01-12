const consola = require('consola');
const StatsLogger = require('../commands/stats/logger');

exports.success = text => {
    consola.success(text);
};

exports.info = text => {
    consola.info(text);
};

exports.warn = text => {
    consola.warn(text);
};

exports.error = text => {
    consola.error(text);
    const logger = new StatsLogger();
    logger.getLastestLog().setError(text);
};
