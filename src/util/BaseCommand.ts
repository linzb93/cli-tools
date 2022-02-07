import logger from './logger.js';
// const spinner = require('./spinner');
import * as helper from './helper.js';

export default abstract class {
  protected logger: typeof logger;
  // protected spinner:any;
  protected helper: typeof helper;
  constructor() {
    this.logger = logger;
    // this.spinner = spinner;
    this.helper = helper;
  }
  abstract run(): void;
}
