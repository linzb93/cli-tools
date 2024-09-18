import ora, { Ora } from "ora";
import logSymbols from "log-symbols";
interface Setting {
  showTime: boolean;
}

export class Spinner {
  private spinner = ora({
    interval: 100,
  });
  private setting: Setting;
  get text() {
    return this.spinner.text;
  }
  set text(value) {
    if (this.spinner.text === "" || !this.spinner.isSpinning) {
      this.start();
    }
    this.spinner.text = value;
    this.spinner.spinner = "dots";
  }
  get isSpinning() {
    return this.spinner.isSpinning;
  }
  start() {
    this.spinner.start();
  }
  warning(text: string) {
    this.spinner.text = text;
    this.spinner.spinner = {
      interval: 100,
      frames: [logSymbols.warning],
    };
  }
  succeed(text?: string, notEnd?: boolean) {
    if (notEnd) {
      if (!this.spinner.isSpinning) {
        this.spinner.start();
      }
      this.spinner.text = text as string;
      this.spinner.spinner = {
        interval: 100,
        frames: [logSymbols.success],
      };
    } else {
      this.spinner.succeed(text);
    }
  }
  fail(text: string, needExit?: boolean) {
    this.spinner.fail(text);
    if (needExit) {
      process.exit(1);
    }
  }
  stop() {
    this.spinner.stop();
  }
  stopAndPersist() {
    this.spinner.stopAndPersist();
  }
  set(options: Partial<Setting>) {
    this.setting = {
      ...this.setting,
      ...options,
    };
  }
}
export default new Spinner();
