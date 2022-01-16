import consola from 'consola';
import logger from './logger.js';
// const spinner = require('./spinner');
import * as helper from './helper.js';

export default class {
    protected logger: typeof logger;
    protected spinner:any;
    protected helper: typeof helper;
    constructor() {
        this.logger = logger;
       // this.spinner = spinner;
        this.helper = helper;
    }
    run() {
        consola.error('run方法必须被重写');
    }
};
