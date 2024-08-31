import logger from "./logger";
import spinner, { Spinner } from "./spinner";
import inquirer from "./inquirer";

export default abstract class {
  protected logger: typeof logger;
  protected spinner: Spinner;
  protected inquirer: typeof inquirer;
  constructor() {
    this.logger = logger;
    this.spinner = spinner;
    this.inquirer = inquirer;
  }
  abstract main(...args: any[]): void;
}
