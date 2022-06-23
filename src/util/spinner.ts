import ora, { Ora } from 'ora';
import logSymbols from 'log-symbols';
import { ref, Ref } from '@vue/reactivity';

interface Setting {
  showTime: boolean;
}

export class Spinner {
  private spinner: Ora;
  private setting: Setting;
  private duration: Ref;
  private timer: any;
  constructor() {
    this.spinner = ora({
      interval: 100
    });
    this.setting = {
      showTime: false
    };
    this.duration = ref(0);
  }
  get text() {
    return this.spinner.text;
  }
  set text(value) {
    if (this.spinner.text === '' || !this.spinner.isSpinning) {
      this.start();
    }
    this.spinner.text = value;
    if (this.spinner.spinner !== 'dots') {
      this.spinner.spinner = 'dots';
    }
  }
  get isSpinning() {
    return this.spinner.isSpinning;
  }
  start() {
    if (this.setting.showTime) {
      this.timer = setInterval(() => {
        this.duration.value++;
      }, 1000);
    }
    this.spinner.start();
  }
  warning(text: string) {
    this.spinner.text = text;
    this.spinner.spinner = {
      interval: 100,
      frames: [logSymbols.warning]
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
        frames: [logSymbols.success]
      };
    } else {
      this.spinner.succeed(text);
      clearInterval(this.timer);
    }
  }
  fail(text: string, needExit?: boolean) {
    this.spinner.fail(text);
    clearInterval(this.timer);
    if (needExit) {
      process.exit(1);
    }
  }
  stop() {
    this.spinner.stop();
    clearInterval(this.timer);
  }
  stopAndPersist() {
    this.spinner.stopAndPersist();
    clearInterval(this.timer);
  }
  set(options: Partial<Setting>) {
    this.setting = {
      ...this.setting,
      ...options
    };
  }
}
export default new Spinner();
