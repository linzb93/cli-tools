import ora, { Ora } from 'ora';

export default class {
  private spinner: Ora;
  constructor() {
    this.spinner = ora();
  }
  get text() {
    return this.spinner.text;
  }
  set text(value) {
    if (this.spinner.text === '') {
      this.spinner.start();
    }
    this.spinner.text = value;
  }
  succeed(text?: string) {
    this.spinner.succeed(text);
  }
  fail(text: string) {
    this.spinner.fail(text);
  }
  stop() {
    this.spinner.stop();
  }
}

// import Helper from './helper';
// const createProxy = require('./proxy');
// const { isWin } = new Helper();
// const defaults = {
//   timeWarning: 3000,
//   timeout: 5000,
//   exitText: '运行超时，进程已自动退出'
// };
// let options = { ...defaults };
// const rawSpinner = ora({
//   interval: isWin ? 1000 : 100
// });
// let counter = 0; // 计时器数字
// let timer = null; // 计时器
// let outerText = '';
// const spinner = createProxy(rawSpinner, {
//   start() {
//     timer = setInterval(() => {
//       counter++;
//       if (
//         counter > options.timeWarning / 1000 &&
//         counter <= options.timeout / 1000
//       ) {
//         rawSpinner.text = outerText + counter;
//       } else if (counter > options.timeout / 1000) {
//         spinner.fail(options.exitText);
//         process.exit(1);
//       }
//     }, 1000);
//   },
//   succeed() {
//     clearInterval(timer);
//   },
//   stop() {
//     clearInterval(timer);
//   },
//   stopAndPersist() {
//     clearInterval(timer);
//   },
//   fail() {
//     clearInterval(timer);
//   },
//   text: {
//     set(value) {
//       if (outerText === '' || !rawSpinner.isSpinning) {
//         spinner.start();
//       }
//       outerText = value;
//     }
//   }
// });
// spinner.set = (opt = {}) => {
//   options = { ...defaults, ...opt };
// };

// module.exports = spinner;
