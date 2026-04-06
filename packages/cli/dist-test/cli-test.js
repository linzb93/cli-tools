#!/usr/bin/env node
import { Command } from "commander";
import { Subject, map, concatMap, from, interval, first } from "rxjs";
import { Writable } from "node:stream";
import readline from "node:readline";
import { join, resolve } from "node:path";
import chalk from "chalk";
import dayjs from "dayjs";
import fs from "fs-extra";
import logSymbols from "log-symbols";
import terminalSize from "terminal-size";
import stringWidth from "string-width";
import ora from "ora";
import { fileURLToPath } from "node:url";
import fs$1 from "node:fs";
import "node:fs/promises";
import binarySplit from "binary-split";
import through from "through2";
import { fork } from "node:child_process";
import internalIp from "internal-ip";
const version = "7.4.0";
const globalPkg = {
  version
};
class Spinner {
  constructor() {
    this.spinner = ora({
      interval: 100
    });
  }
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
  warning(text) {
    this.spinner.text = text;
    this.spinner.spinner = {
      interval: 100,
      frames: [logSymbols.warning]
    };
  }
  succeed(text, notEnd) {
    if (notEnd) {
      if (!this.spinner.isSpinning) {
        this.spinner.start();
      }
      this.spinner.text = text;
      this.spinner.spinner = {
        interval: 100,
        frames: [logSymbols.success]
      };
    } else {
      this.spinner.succeed(text);
    }
  }
  fail(text, needExit) {
    this.spinner.fail(text);
    if (needExit) {
      process.exit(1);
    }
  }
  /**
   * 暂停，但会清空文字
   */
  stop() {
    this.spinner.stop();
  }
  /**
   * 暂停，保持显示的文字
   */
  stopAndPersist() {
    this.spinner.stopAndPersist();
  }
  set(options) {
    this.setting = {
      ...this.setting,
      ...options
    };
  }
}
const spinner = new Spinner();
process.platform === "win32";
const root = join(fileURLToPath(import.meta.url), "../../../../");
const cacheRoot = join(root, "cache");
join(cacheRoot, "temp");
const beforeLog = () => {
  if (process.env.VITEST) {
    return false;
  }
  let isStop = false;
  if (spinner.isSpinning) {
    spinner.stop();
    isStop = true;
  }
  return isStop;
};
const afterLog = (needRestart) => {
  if (needRestart) {
    spinner.start();
  }
};
const success = (text) => {
  const needRestart = beforeLog();
  console.log(`${logSymbols.success} ${text}`);
  afterLog(needRestart);
};
const info = (text) => {
  const needRestart = beforeLog();
  console.log(`${logSymbols.info} ${text}`);
  afterLog(needRestart);
};
const warn = (text) => {
  const needRestart = beforeLog();
  console.log(`${logSymbols.warning} ${text}`);
  afterLog(needRestart);
};
const error = (text, needExit) => {
  const needRestart = beforeLog();
  console.log(`${logSymbols.error} ${text}`);
  afterLog(needRestart);
  if (needExit) {
    process.exit(1);
  }
};
const clearConsole = (start = 0, clearAll) => {
  if (process.stdout.isTTY) {
    if (!clearAll) {
      const blank = "\n".repeat(process.stdout.rows);
      console.log(blank);
    }
    readline.cursorTo(process.stdout, 0, start);
    readline.clearScreenDown(process.stdout);
  }
};
const backwardConsole = (times = 1) => {
  if (process.stdout.isTTY) {
    for (let i = 0; i < times; i++) {
      process.stdout.moveCursor(0, -1);
      process.stdout.clearLine(0);
    }
  }
};
const box = (options) => {
  const { columns } = terminalSize();
  const title = chalk.bgRed.white(` ${options.title} `);
  const titleEdgeLength = Math.floor((columns - stringWidth(title)) / 2);
  console.log(
    // @ts-ignore
    `${chalk[options.borderColor](`-`.repeat(titleEdgeLength))}${title}${chalk[options.borderColor](
      `-`.repeat(titleEdgeLength)
    )}`
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
};
const cli = (content) => {
  const year = dayjs().format("YYYY");
  const quarter = Math.ceil(Number(dayjs().format("MM")) / 3);
  const filename = `${year}Q${quarter}.log`;
  const targetFilename = resolve(cacheRoot, "track", filename);
  const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const command = content.trim();
  const logLine = `[${time}] ${command}
`;
  try {
    fs.appendFileSync(targetFilename, logLine, "utf8");
  } catch (error2) {
    console.error("写入日志文件失败:", error2);
  }
};
const web = (content) => {
  fs.appendFile(resolve(cacheRoot, "serverLog.txt"), `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${content}
`);
};
const logger = {
  success,
  info,
  warn,
  error,
  clearConsole,
  backwardConsole,
  box,
  cli,
  web
};
const features = [
  "analyse cli",
  "analyse code",
  "cd",
  "cg",
  "clear",
  "color",
  "cookie",
  "curl",
  "eng",
  "fork",
  "git branch",
  "git clone",
  "git commit",
  "git deploy",
  "git log",
  "git merge",
  "git pull",
  "git push",
  "git scan",
  "git tag",
  "idea",
  "ip",
  "iteration",
  "kill",
  "mock",
  "npm has",
  "npm search",
  "npm uninstall",
  "occ",
  "ocr",
  "repl",
  "sass",
  "server",
  "shortcut",
  "size",
  "time",
  "token",
  "tree",
  "vue",
  "yapi"
];
const findContent = (options) => {
  const { moduleName, title } = options;
  const fileDirStr = join(fileURLToPath(import.meta.url), "../../../shared/src/business", moduleName);
  let filePathStr = "";
  if (!title.startsWith("--")) {
    filePathStr = join(fileDirStr, title.replace(" ", "/"), `docs/help.md`);
  } else {
    filePathStr = join(fileDirStr, "docs/help.md");
  }
  const sortedFeatures = [...features].sort((a, b) => b.length - a.length);
  const featurePattern = new RegExp(`\\b(${sortedFeatures.join("|")})\\b`, "g");
  let inBashBlock = false;
  const stream = fs.createReadStream(filePathStr);
  return stream.pipe(binarySplit("\n")).pipe(
    through(function(chunk, enc, next) {
      let line = chunk.toString();
      if (line.trim().match(/^```bash/i)) {
        inBashBlock = true;
      } else if (inBashBlock && line.trim().match(/^```/)) {
        inBashBlock = false;
      }
      if (inBashBlock) {
        line = line.replace(/mycli/g, chalk.yellow("mycli"));
        line = line.replace(featurePattern, (match) => chalk.blue(match));
      }
      this.push(line);
      next();
    })
  );
};
const fromStream = (stream) => {
  const task = new Subject();
  stream.on("data", (data) => {
    task.next(data);
  });
  stream.on("finish", () => {
    task.complete();
  });
  return task;
};
new Writable({
  write(data, enc, callback) {
    callback();
  }
});
const generateHelpDoc = (commands) => {
  return new Promise(async (resolve2) => {
    try {
      const stream = findContent({
        moduleName: commands[0],
        title: commands[2] && !commands[2].startsWith("--") ? `${commands[1]} ${commands[2]}` : commands[1]
      });
      fromStream(stream).pipe(
        map((data) => `${data.toString()}
`),
        concatMap(
          (line) => from(line.split("")).pipe(
            concatMap(
              (char) => interval(100).pipe(
                first(),
                map(() => char)
              )
            )
          )
        )
      ).subscribe({
        next(data) {
          process.stdout.write(data);
        },
        complete: () => {
          resolve2();
        }
      });
    } catch (error2) {
      logger.error(`没有找到${commands.join(" ")}的帮助文档`);
      resolve2();
    }
  });
};
const forkService = async (filename, options) => {
  const cwd = process.cwd();
  if (!fs$1.existsSync(resolve(cwd, filename))) {
    logger.error(`文件${filename}不存在`);
    return;
  }
  const child = fork(resolve(cwd, filename), {
    cwd,
    detached: true,
    stdio: [null, null, null, "ipc"]
  });
  child.on("message", async (msgData) => {
    if (!msgData) {
      console.log("服务器已启动");
    } else {
      const ip = await internalIp.v4();
      console.log(`服务器已启动。${chalk.magenta(`http://${ip}:${msgData.port}`)}`);
    }
    child.unref();
    child.disconnect();
    process.exit(0);
  });
  if (options.duration) {
    setTimeout(() => {
      try {
        console.log(`服务器已启动。`);
        child.unref();
        process.exit(0);
      } catch (error2) {
      }
    }, options.duration * 1e3);
  }
};
const forkCommand = (filename, options) => {
  forkService(filename, options);
};
const program = new Command();
program.version(globalPkg.version).description("CLI工具集合");
program.hook("preAction", () => {
  return new Promise((resolve2) => {
    setTimeout(async () => {
      if (process.argv.includes("--help")) {
        (async () => {
          const mainCommand = process.argv[2];
          await generateHelpDoc([mainCommand, process.argv[3], process.argv[4]]);
          process.exit(0);
        })();
      } else {
        resolve2();
      }
    }, 100);
  });
});
program.command("fork [filename]").option("--duration <duration>", "服务等待断联时间（秒）").action((file, options) => {
  forkCommand(file, options);
});
program.parse(process.argv.filter((cmd) => ["--debug", "--help"].includes(cmd) === false));
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
