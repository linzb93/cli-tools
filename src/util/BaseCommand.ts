import logger from "./logger.js";
import spinner, { Spinner } from "./spinner.js";

export default abstract class {
  protected logger: typeof logger;
  protected spinner: Spinner;
  constructor() {
    this.logger = logger;
    this.spinner = spinner;
  }
  abstract run(): void;
}
