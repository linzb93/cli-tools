import logger from "./logger";
import * as rawHelper from "./helper";
import spinner, { Spinner } from "./spinner";
import git from "./git";
import npm from "./npm";
import * as pFunc from "./pFunc";
import ls from "./ls";
import inquirer from "./inquirer";

const helper = {
  ...rawHelper,
  ...pFunc,
  inquirer,
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
    this.spinner = spinner;
    this.helper = helper;
    this.ls = ls;
    this.git = git;
    this.npm = npm;
  }
  abstract run(): void;
}
