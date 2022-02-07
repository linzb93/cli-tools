import consola from 'consola';
import readline from 'readline';

export default {
  success(text: string): void {
    consola.success(text);
  },
  info(text: string): void {
    consola.info(text);
  },
  warn(text: string): void {
    consola.warn(text);
  },
  error(text: string, needExit?: boolean): void {
    consola.error(text);
    if (needExit) {
      process.exit(1);
    }
  },
  clearConsole(start: number = 0) {
    if (process.stdout.isTTY) {
      const blank = '\n'.repeat(process.stdout.rows);
      console.log(blank);
      readline.cursorTo(process.stdout, 0, start);
      readline.clearScreenDown(process.stdout);
    }
  }
};
