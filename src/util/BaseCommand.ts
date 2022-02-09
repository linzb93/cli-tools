import logger from './logger.js';
import Spinner from './spinner.js';
import * as rawHelper from './helper.js';
import * as pFunc from './pFunc.js';
import git from './git.js';
import npm from './npm.js';
import db from './db.js';

const helper = {
  ...rawHelper,
  ...pFunc
};

export default abstract class {
  protected logger: typeof logger;
  protected spinner: Spinner;
  protected helper: typeof helper;
  protected db: typeof db;
  protected git: typeof git;
  protected npm: typeof npm;
  constructor() {
    this.logger = logger;
    this.helper = helper;
    this.spinner = new Spinner();
    this.git = git;
    this.npm = npm;
    this.db = db;
  }
  abstract run(): void;
}
