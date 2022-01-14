const consola = require('consola');
const logger = require('./logger');
const spinner = require('./spinner');
const helper = require('./');
module.exports = class BaseCommand {
    constructor() {
        this.logger = logger;
        this.spinner = spinner;
        this.helper = helper;
    }
    run() {
        consola.error('run方法必须被重写');
    }
};
