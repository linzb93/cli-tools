import readline from "node:readline";
import {resolve} from 'node:path';
import chalk from "chalk";
import dayjs from "dayjs";
import fs from 'fs-extra';
import logSymbols from "log-symbols";
import terminalSize from "terminal-size";
import stringWidth from "string-width";
import spinner from './spinner';
import { cacheRoot } from "./constant";

function hook(callback: () => void) {
  let isStop = false;
  if (spinner.isSpinning) {
    spinner.stop();
    isStop = true;
  }
  if (process.env.VITEST) {
    return;
  }
  callback();
  if (isStop) {
    spinner.start();
  }
}

interface BoxOptions {
  title?: string;
  borderColor: string;
  padding?: number;
  content: string;
}

export default {
  success(text: string | number): void {
    hook(() => {
      console.log(`${logSymbols.success} ${text}`);
    });
  },
  info(text: string | number): void {
    hook(() => {
      console.log(`${logSymbols.info} ${text}`);
    });
  },
  warn(text: string | number): void {
    hook(() => {
      console.log(`${logSymbols.warning} ${text}`);
    });
  },
  error(text: string | number, needExit?: boolean): void {
    hook(() => {
      console.log(`${logSymbols.error} ${text}`);
    });
    if (needExit) {
      process.exit(1);
    }
  },
  clearConsole(start = 0, clearAll?: boolean) {
    if (process.stdout.isTTY) {
      if (!clearAll) {
        const blank = "\n".repeat(process.stdout.rows);
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
  },
  // 替代原来的boxen
  box(options: BoxOptions) {
    const { columns } = terminalSize();
    const title = chalk.bgRed.white(` ${options.title} `);
    const titleEdgeLength = Math.floor((columns - stringWidth(title)) / 2);
    console.log(
      `${chalk[options.borderColor](
        `-`.repeat(titleEdgeLength)
      )}${title}${chalk[options.borderColor](`-`.repeat(titleEdgeLength))}`
    );
    if (options.padding) {
      for (let i = 0; i < options.padding; i++) {
        console.log("");
      }
    }
    console.log(options.content);
    if (options.padding) {
      for (let i = 0; i < options.padding; i++) {
        console.log("");
      }
    }
    console.log(chalk[options.borderColor](`-`.repeat(columns)));
  },
  // cli输出日志
  cli(content: string) {
    fs.appendFile(
      resolve(cacheRoot, "track.txt"),
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${content}\n`
    );
  },
  // server输出日志
  web(content: string) {
    fs.appendFile(
      resolve(cacheRoot, "serverLog.txt"),
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${content}\n`
    );
  }
};
