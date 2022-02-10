import ora, { Ora } from 'ora';
import logSymbols from 'log-symbols';

export class Spinner {
  private spinner: Ora;
  constructor() {
    this.spinner = ora({
      interval: 100
    });
  }
  get text() {
    return this.spinner.text;
  }
  set text(value) {
    if (this.spinner.text === '' || !this.spinner.isSpinning) {
      this.spinner.start();
    }
    this.spinner.text = value;
    if (this.spinner.spinner !== 'dots') {
      this.spinner.spinner = 'dots';
    }
  }
  get isSpinning() {
    return this.spinner.isSpinning;
  }
  succeed(text?: string, notEnd?: boolean) {
    if (notEnd) {
      if (!this.spinner.isSpinning) {
        this.spinner.start();
      }
      this.spinner.text = text as string;
      this.spinner.spinner = {
        interval: 100,
        frames: [logSymbols.success]
      };
    } else {
      this.spinner.succeed(text);
    }
  }
  fail(text: string) {
    this.spinner.fail(text);
  }
  stop() {
    this.spinner.stop();
  }
}
export default new Spinner();
