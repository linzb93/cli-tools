import consola from 'consola';
import readline from 'readline';
import spinner from './spinner.js';
import lodash from 'lodash';

const { isPlainObject } = lodash;

function hook() {
  if (spinner.isSpinning) {
    spinner.stop();
  }
}

export default {
  success(text: string | number): void {
    hook();
    consola.success(text);
  },
  info(text: string | number): void {
    hook();
    consola.info(text);
  },
  warn(text: string | number): void {
    hook();
    consola.warn(text);
  },
  error(text: string | number, needExit?: boolean): void {
    hook();
    consola.error(text);
    if (needExit) {
      process.exit(1);
    }
  },
  debug(content: any) {
    if (process.argv.includes('--debug')) {
      let str = '';
      if (isPlainObject(content)) {
        try {
          str = JSON.stringify(content);
        } catch (error) {}
      } else {
        str = content.toString();
      }
      console.log(`debug：${str}`);
    }
  },
  clearConsole(start = 0, clearAll?: boolean) {
    if (process.stdout.isTTY) {
      if (!clearAll) {
        const blank = '\n'.repeat(process.stdout.rows);
        console.log(blank);
      }
      readline.cursorTo(process.stdout, 0, start);
      readline.clearScreenDown(process.stdout);
    }
  },
  backwardConsole() {
    if (process.stdout.isTTY) {
      process.stdout.moveCursor(0, -1);
      process.stdout.clearLine(0);
    }
  }
};
