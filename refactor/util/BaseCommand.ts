import logger from './logger.js';
import spinner, { Spinner } from './spinner.js';
import * as rawHelper from './helper.js';
import * as pFunc from './pFunc.js';
import git from './git.js';
import npm from './npm.js';
import ls from './ls.js';
import inquirer from './inquirer.js';

const helper = {
  ...rawHelper,
  ...pFunc,
  inquirer
};

export default abstract class {
  protected logger: typeof logger;
  protected spinner: Spinner;
  protected helper: typeof helper;
  protected ls: typeof ls;
  protected git: typeof git;
  protected npm: typeof npm;
  constructor() {
    this.logger = logger;
    this.helper = helper;
    this.spinner = spinner;
    this.git = git;
    this.npm = npm;
    this.ls = ls;
  }
  abstract run(): void;
}
