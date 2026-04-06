#!/usr/bin/env node
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _filename, _tempFilename, _locked, _prev, _next, _nextPromise, _nextData, _Writer_instances, add_fn, write_fn, _filename2, _writer, _adapter, _parse, _stringify, _data;
import { Command } from "commander";
import { Subject, map, concatMap, from, interval, first } from "rxjs";
import { Writable } from "node:stream";
import readline from "node:readline";
import path, { join, dirname, basename, resolve } from "node:path";
import chalk from "chalk";
import dayjs from "dayjs";
import fs from "fs-extra";
import logSymbols from "log-symbols";
import terminalSize from "terminal-size";
import stringWidth from "string-width";
import ora from "ora";
import { fileURLToPath } from "node:url";
import fs$1 from "node:fs";
import fsp, { writeFile, rename, readFile } from "node:fs/promises";
import binarySplit from "binary-split";
import through from "through2";
import { execaCommand, execa } from "execa";
import inquirer$1 from "inquirer";
import open from "open";
import { readPackage } from "read-pkg";
import semver from "semver";
import clipboardy from "clipboardy";
import { sleep } from "@linzb93/utils";
import Table from "cli-table3";
import pMap from "p-map";
import pReduce from "p-reduce";
import Progress from "progress";
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
function getTempFilename(file) {
  const f = file instanceof URL ? fileURLToPath(file) : file.toString();
  return join(dirname(f), `.${basename(f)}.tmp`);
}
async function retryAsyncOperation(fn, maxRetries, delayMs) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error2) {
      if (i < maxRetries - 1) {
        await new Promise((resolve2) => setTimeout(resolve2, delayMs));
      } else {
        throw error2;
      }
    }
  }
}
class Writer {
  constructor(filename) {
    __privateAdd(this, _Writer_instances);
    __privateAdd(this, _filename);
    __privateAdd(this, _tempFilename);
    __privateAdd(this, _locked, false);
    __privateAdd(this, _prev, null);
    __privateAdd(this, _next, null);
    __privateAdd(this, _nextPromise, null);
    __privateAdd(this, _nextData, null);
    __privateSet(this, _filename, filename);
    __privateSet(this, _tempFilename, getTempFilename(filename));
  }
  async write(data) {
    return __privateGet(this, _locked) ? __privateMethod(this, _Writer_instances, add_fn).call(this, data) : __privateMethod(this, _Writer_instances, write_fn).call(this, data);
  }
}
_filename = new WeakMap();
_tempFilename = new WeakMap();
_locked = new WeakMap();
_prev = new WeakMap();
_next = new WeakMap();
_nextPromise = new WeakMap();
_nextData = new WeakMap();
_Writer_instances = new WeakSet();
// File is locked, add data for later
add_fn = function(data) {
  __privateSet(this, _nextData, data);
  __privateGet(this, _nextPromise) || __privateSet(this, _nextPromise, new Promise((resolve2, reject) => {
    __privateSet(this, _next, [resolve2, reject]);
  }));
  return new Promise((resolve2, reject) => {
    var _a;
    (_a = __privateGet(this, _nextPromise)) == null ? void 0 : _a.then(resolve2).catch(reject);
  });
};
write_fn = async function(data) {
  var _a, _b;
  __privateSet(this, _locked, true);
  try {
    await writeFile(__privateGet(this, _tempFilename), data, "utf-8");
    await retryAsyncOperation(async () => {
      await rename(__privateGet(this, _tempFilename), __privateGet(this, _filename));
    }, 10, 100);
    (_a = __privateGet(this, _prev)) == null ? void 0 : _a[0]();
  } catch (err) {
    if (err instanceof Error) {
      (_b = __privateGet(this, _prev)) == null ? void 0 : _b[1](err);
    }
    throw err;
  } finally {
    __privateSet(this, _locked, false);
    __privateSet(this, _prev, __privateGet(this, _next));
    __privateSet(this, _next, __privateSet(this, _nextPromise, null));
    if (__privateGet(this, _nextData) !== null) {
      const nextData = __privateGet(this, _nextData);
      __privateSet(this, _nextData, null);
      await this.write(nextData);
    }
  }
};
class TextFile {
  constructor(filename) {
    __privateAdd(this, _filename2);
    __privateAdd(this, _writer);
    __privateSet(this, _filename2, filename);
    __privateSet(this, _writer, new Writer(filename));
  }
  async read() {
    let data;
    try {
      data = await readFile(__privateGet(this, _filename2), "utf-8");
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return data;
  }
  write(str) {
    return __privateGet(this, _writer).write(str);
  }
}
_filename2 = new WeakMap();
_writer = new WeakMap();
class DataFile {
  constructor(filename, { parse, stringify }) {
    __privateAdd(this, _adapter);
    __privateAdd(this, _parse);
    __privateAdd(this, _stringify);
    __privateSet(this, _adapter, new TextFile(filename));
    __privateSet(this, _parse, parse);
    __privateSet(this, _stringify, stringify);
  }
  async read() {
    const data = await __privateGet(this, _adapter).read();
    if (data === null) {
      return null;
    } else {
      return __privateGet(this, _parse).call(this, data);
    }
  }
  write(obj) {
    return __privateGet(this, _adapter).write(__privateGet(this, _stringify).call(this, obj));
  }
}
_adapter = new WeakMap();
_parse = new WeakMap();
_stringify = new WeakMap();
class JSONFile extends DataFile {
  constructor(filename) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data) => JSON.stringify(data, null, 2)
    });
  }
}
class Memory {
  constructor() {
    __privateAdd(this, _data, null);
  }
  read() {
    return Promise.resolve(__privateGet(this, _data));
  }
  write(obj) {
    __privateSet(this, _data, obj);
    return Promise.resolve();
  }
}
_data = new WeakMap();
function checkArgs(adapter, defaultData) {
  if (adapter === void 0)
    throw new Error("lowdb: missing adapter");
  if (defaultData === void 0)
    throw new Error("lowdb: missing default data");
}
class Low {
  adapter;
  data;
  constructor(adapter, defaultData) {
    checkArgs(adapter, defaultData);
    this.adapter = adapter;
    this.data = defaultData;
  }
  async read() {
    const data = await this.adapter.read();
    if (data)
      this.data = data;
  }
  async write() {
    if (this.data)
      await this.adapter.write(this.data);
  }
  async update(fn) {
    fn(this.data);
    await this.write();
  }
}
async function JSONFilePreset(filename, defaultData) {
  const adapter = process.env.NODE_ENV === "test" ? new Memory() : new JSONFile(filename);
  const db = new Low(adapter, defaultData);
  await db.read();
  return db;
}
async function operateJsonDatabase(filename, callback) {
  const dbPath = join(cacheRoot, filename);
  const db = await JSONFilePreset(dbPath, {});
  await db.read();
  const data = db.data;
  let result;
  if (typeof callback === "function") {
    result = await callback(data, db);
  }
  if (result === null || result === void 0) {
    await db.write();
  }
  return result;
}
async function readSecret(callback) {
  return operateJsonDatabase("secret.json", callback);
}
async function sql(callback) {
  return operateJsonDatabase("app.json", callback);
}
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
const isGithubProject = async () => {
  try {
    const { stdout } = await execaCommand("git remote -v");
    return stdout.includes("github.com");
  } catch (error2) {
    return false;
  }
};
async function isGitProject(projectPath = process.cwd()) {
  try {
    await execaCommand(`git rev-parse --is-inside-work-tree`, { cwd: projectPath });
    return true;
  } catch {
    return false;
  }
}
async function getCurrentBranchName(projectPath = process.cwd()) {
  try {
    const { stdout } = await execaCommand(`git rev-parse --abbrev-ref HEAD`, { cwd: projectPath });
    return stdout.trim();
  } catch {
    return "";
  }
}
var GitStatusMap = /* @__PURE__ */ ((GitStatusMap2) => {
  GitStatusMap2[GitStatusMap2["Unknown"] = 0] = "Unknown";
  GitStatusMap2[GitStatusMap2["Uncommitted"] = 1] = "Uncommitted";
  GitStatusMap2[GitStatusMap2["Unpushed"] = 2] = "Unpushed";
  GitStatusMap2[GitStatusMap2["Pushed"] = 3] = "Pushed";
  GitStatusMap2[GitStatusMap2["NotOnMainBranch"] = 4] = "NotOnMainBranch";
  return GitStatusMap2;
})(GitStatusMap || {});
async function getGitProjectStatus(projectPath = process.cwd()) {
  const output = {
    status: 0,
    branchName: ""
  };
  if (!await isGitProject(projectPath)) {
    return output;
  }
  const branchName = await getCurrentBranchName(projectPath);
  output.branchName = branchName;
  try {
    const { stdout } = await execaCommand("git status", {
      cwd: projectPath
    });
    if (stdout.includes("Changes not staged for commit") || stdout.includes("Changes to be committed")) {
      output.status = 1;
      return output;
    }
    if (stdout.includes("Your branch is ahead of ")) {
      output.status = 2;
      return output;
    }
    if (!["master", "main"].includes(branchName)) {
      output.status = 4;
      return output;
    }
    if (stdout.includes("nothing to commit")) {
      output.status = 3;
      return output;
    }
    return output;
  } catch (error2) {
    output.status = 0;
    return output;
  }
}
async function getAllTags(projectPath = process.cwd()) {
  try {
    const { stdout } = await execaCommand(`git tag`, { cwd: projectPath });
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
async function deleteTags({
  tags,
  projectPath = process.cwd(),
  remote = false
}) {
  const deletePromises = tags.map(async (tag) => {
    await execaCommand(`git tag -d ${tag}`, { cwd: projectPath });
    if (remote) {
      await execaCommand(`git push origin :refs/tags/${tag}`, { cwd: projectPath });
    }
  });
  await Promise.all(deletePromises);
}
async function getAllBranches(projectPath = process.cwd()) {
  try {
    const { stdout: localOutput } = await execaCommand(`git branch`, { cwd: projectPath });
    const localBranches = localOutput.trim().split("\n").filter(Boolean).map((line) => line.trim().replace(/^\*\s*/, ""));
    const { stdout: remoteOutput } = await execaCommand(`git branch -r`, { cwd: projectPath });
    const remoteBranches = remoteOutput.trim().split("\n").filter(Boolean).map((line) => line.trim()).filter((branch) => !branch.includes("HEAD")).map((branch) => {
      const parts = branch.split("/");
      return parts.length > 1 ? parts.slice(1).join("/") : branch;
    });
    const allBranchNames = [.../* @__PURE__ */ new Set([...localBranches, ...remoteBranches])];
    const branchPromises = allBranchNames.map(async (name) => {
      const isLocal = localBranches.includes(name);
      const isRemote = remoteBranches.includes(name);
      let createTime = "";
      if (isLocal) {
        createTime = await getBranchFirstCommitTime(name, projectPath);
      }
      return {
        name,
        hasLocal: isLocal,
        hasRemote: isRemote,
        createTime: createTime ? dayjs(createTime).format("YYYY-MM-DD") : "无"
      };
    });
    return await Promise.all(branchPromises);
  } catch (error2) {
    console.warn(`获取分支列表失败：${error2}`);
    return [];
  }
}
async function deleteBranch$1(options) {
  const { branchName, projectPath = process.cwd(), remote = false, force = false } = options;
  const command = remote ? `git push origin :refs/heads/${branchName}` : force ? `git branch -D ${branchName}` : `git branch -d ${branchName}`;
  return await execaCommand(command, { cwd: projectPath });
}
async function getMainBranchName(projectPath = process.cwd()) {
  try {
    const branches = await getAllBranches(projectPath);
    const masterBranch = branches.find((b) => b.name === "master");
    const mainBranch = branches.find((b) => b.name === "main");
    return masterBranch ? "master" : mainBranch ? "main" : "";
  } catch {
    return "";
  }
}
async function getBranchFirstCommitTime(branchName, projectPath = process.cwd()) {
  try {
    const { stdout } = await execaCommand(`git log ${branchName} --format=%ci --max-count=1 --reverse`, {
      cwd: projectPath
    });
    return stdout.trim();
  } catch (error2) {
    console.warn(`获取分支 ${branchName} 第一个提交时间失败：${error2}`);
    return "";
  }
}
const isCurrenetBranchPushed = async () => {
  const current = await getCurrentBranchName();
  const { stdout } = await execaCommand(`git branch --all`);
  return !!stdout.split("\n").find((item) => item.endsWith(`remotes/origin/${current}`));
};
const splitGitLog = async (head, cwd = process.cwd()) => {
  var _a;
  const log = await execaCommand(`git log -${head}`, { cwd });
  const list = log.stdout.split("\n").filter(Boolean);
  let result = [];
  for (const line of list) {
    if (line.startsWith("commit")) {
      (_a = result.slice(-1)[0]) == null ? void 0 : _a.message.trimEnd();
      result.push({
        id: line.split(" ")[1],
        author: "",
        date: "",
        message: ""
      });
      continue;
    }
    if (line.startsWith("Author:")) {
      result.slice(-1)[0].author = line.split("Author: ")[1].trim();
      continue;
    }
    if (line.startsWith("Date:")) {
      result.slice(-1)[0].date = dayjs(line.split("Date: ")[1].trim()).format("YYYY-MM-DD HH:mm:ss");
      continue;
    }
    result.slice(-1)[0].message += line.trim() + "\n";
  }
  if (result.length) {
    result = result.map((item) => ({
      ...item,
      message: item.message.trimEnd().replace(/\n$/, "")
    }));
  }
  return result;
};
class StopExecutionError extends Error {
  constructor(message) {
    super(message);
    this.name = "StopExecutionError";
  }
}
const formatError = (error2) => {
  const lines = error2.split("\n").filter(Boolean);
  if (lines.length === 0) return "";
  return lines.map((line, index) => {
    if (index === lines.length - 1) {
      return chalk.gray(`└─ ${line}`);
    }
    return chalk.gray(`├─ ${line}`);
  }).join("\n");
};
async function executeCommand(config, options = {}) {
  const cwd = options.cwd || process.cwd();
  await retryAsync(
    async () => {
      try {
        const { stdout } = await execaCommand(config.message, { cwd });
        if (stdout) {
          console.log(stdout);
        }
      } catch (error2) {
        const errorMessage = error2 instanceof Error ? error2.message : String(error2);
        if (config.onError) {
          const result = await config.onError(errorMessage);
          if (result && typeof result === "object" && result.shouldStop) {
            throw new StopExecutionError(errorMessage);
          }
        }
        throw error2;
      }
    },
    {
      maxAttempts: config.maxAttempts || 1,
      onFail: (attempt, error2) => {
        const shouldStop = error2 instanceof StopExecutionError;
        if (!shouldStop) {
          console.log(
            `第${chalk.yellow.bold(attempt.toString())}次重复${chalk.magenta(
              `[${dayjs().format("HH:mm:ss")}]`
            )}`
          );
          console.log(formatError(error2.message));
        }
        return {
          shouldStop
        };
      }
    }
  );
}
async function retryAsync(fn, options = {}) {
  const { maxAttempts = 10, onFail } = options;
  let attempt = 1;
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error2) {
      if (typeof onFail === "function") {
        const { shouldStop } = onFail(attempt, error2);
        if (shouldStop) {
          throw error2 instanceof Error ? error2 : new Error(error2);
        }
      }
      if (attempt === maxAttempts) {
        throw error2;
      }
      attempt++;
    }
  }
  throw new Error("Maximum retry attempts reached");
}
async function executeCommands(commands, options) {
  const startTime = dayjs();
  if (!(options == null ? void 0 : options.silentStart)) {
    console.log(`${startTime.format("HH:mm:ss")} 开始执行命令`);
  }
  for (const cmd of commands) {
    const config = typeof cmd === "string" ? { message: cmd } : cmd;
    console.log(`${chalk.cyan(">")} ${chalk.yellow(config.message)}`);
    if (process.env.DEBUG) {
      console.log(chalk.green("调试模式：跳过实际执行"));
      continue;
    }
    try {
      await executeCommand(config, { cwd: options == null ? void 0 : options.cwd });
    } catch (error2) {
      if (error2 instanceof StopExecutionError) {
        console.log(chalk.red("命令执行已停止"));
      }
      throw error2;
    }
  }
  if (!(options == null ? void 0 : options.silentStart)) {
    const endTime = dayjs();
    const duration = endTime.diff(startTime, "millisecond") / 1e3;
    console.log(`${endTime.format("HH:mm:ss")} 任务执行完成，用时${chalk.blue(duration.toFixed(2))}秒`);
  }
}
const inquirer = {
  async prompt(options) {
    if (spinner.isSpinning) {
      spinner.stop();
    }
    const answer = await inquirer$1.prompt(options);
    if (spinner.text !== "") {
      spinner.start();
    }
    return answer;
  }
};
function fmtCommitMsg(rawCommit) {
  let commit2 = rawCommit.trim().replace(/\s+/g, "-");
  if (!commit2) {
    return "feat:update";
  }
  const prefixes = [
    {
      value: "revert",
      key: ["回滚", "撤销", "revert", "undo"]
    },
    {
      value: "docs",
      key: ["文档", "注释", "doc", "docs", "document", "comment", "readme"]
    },
    {
      value: "style",
      key: ["样式", "格式", "format", "lint", "style", "code style", "prettier", "eslint"]
    },
    {
      value: "perf",
      key: ["性能", "速度", "perf", "performance", "speed"]
    },
    {
      value: "test",
      key: ["测试", "用例", "test", "case", "spec", "e2e", "unit", "coverage"]
    },
    {
      value: "build",
      key: ["构建", "依赖", "build", "dependencies", "npm", "yarn", "pnpm", "webpack", "vite", "rollup", "cargo"]
    },
    {
      value: "ci",
      key: ["ci", "workflow", "pipeline", "action", "jenkins", "travis", "circle", "github actions"]
    },
    {
      value: "chore",
      key: ["杂项", "工具", "配置", "chore", "tool", "config", "settings", ".gitignore", "package.json"]
    },
    {
      value: "refactor",
      key: ["重构", "优化", "refactor", "improve", "optimize"],
      replaceFunction: (commit3) => commit3.replace(/^(重构|优化)[,|，|\s|:|：|-]/, "")
    },
    {
      value: "fix",
      key: ["修复", "bug", "fix", "解决", "问题", "issue"]
    },
    {
      value: "feat",
      key: ["新增", "功能", "feature", "new", "feat", "添加", "implement"]
    }
  ];
  const match = prefixes.find((item) => commit2.startsWith(`${item.value}:`));
  if (match) {
    return commit2;
  }
  const match2 = prefixes.find((item) => {
    if (!item.key) {
      return false;
    }
    if (Array.isArray(item.key)) {
      return item.key.some((text) => commit2.includes(text));
    }
    return commit2.includes(item.key);
  });
  if (!match2) {
    return `feat:${commit2}`;
  }
  if (match2.replaceFunction) {
    commit2 = `${match2.replaceFunction(commit2)}`;
  }
  return `${match2.value}:${commit2}`;
}
async function handleConflict() {
  const { resolved } = await inquirer.prompt([
    {
      message: "代码合并失败，检测到代码有冲突，是否已解决？",
      type: "confirm",
      default: true,
      name: "resolved"
    }
  ]);
  if (!resolved) {
    throw new Error("exit");
  }
  await executeCommands(["git add .", "git commit -m fix:conflict"]);
}
function commit(message) {
  return {
    message: `git commit -m ${fmtCommitMsg(message)}`,
    onError: async () => {
      return {
        shouldStop: true
      };
    }
  };
}
function pull() {
  return {
    message: "git pull",
    maxAttempts: 100,
    onError: async (errMsg) => {
      if (errMsg.includes("You have unstaged changes")) {
        await executeCommands(["git add .", "git commit -m feat:update", this.pull()]);
        return {
          shouldStop: true
        };
      }
      if (errMsg.toLowerCase().includes("timeout")) {
        return {
          shouldStop: false
        };
      }
      return {
        shouldStop: true
      };
    }
  };
}
function merge(branch) {
  return {
    message: `git merge ${branch}`,
    onError: async () => {
      await handleConflict();
      return {
        shouldStop: true
      };
    }
  };
}
function push(isLocalBranch, currenetBranchName) {
  return {
    message: isLocalBranch ? `git push --set-upstream origin ${currenetBranchName}` : "git push",
    maxAttempts: 100,
    onError: async (errMsg) => {
      if (errMsg.toLowerCase().includes("timeout") || errMsg.includes("Couldn't connect to server")) {
        return {
          shouldStop: false
        };
      }
      return {
        shouldStop: true
      };
    }
  };
}
function clone(repo, dir) {
  const cmd = dir ? `git clone ${repo} ${dir}` : `git clone ${repo}`;
  return {
    message: cmd,
    maxAttempts: 100
  };
}
const gitAtom = {
  commit,
  pull,
  merge,
  push,
  clone
};
const pushService = async (options = {}) => {
  if (!await isGitProject()) {
    logger.error("当前目录不是 Git 项目");
    return;
  }
  try {
    const currentBranch = await getCurrentBranchName();
    if (!currentBranch) {
      logger.error("无法获取当前分支名称");
      return;
    }
    logger.info(`当前分支: ${chalk.green(currentBranch)}`);
    logger.info("正在推送代码...");
    if (await isCurrenetBranchPushed()) {
      await executeCommands([gitAtom.push()]);
      logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程`);
    } else {
      await executeCommands([gitAtom.push(true, currentBranch)]);
      logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程并设置上游分支`);
    }
  } catch (error2) {
    logger.error(`推送失败: ${error2.message || error2}`);
  }
};
const subCommandCompiler = (fn, options = { level: 2 }) => {
  if (options.level < 2) {
    throw new Error("不能设置level小于2");
  }
  const program2 = new Command();
  fn(program2);
  const commands = process.argv.filter((item, index) => {
    if (options.level === 2) {
      return item !== "--debug" && index !== 2;
    }
    return index < 2 || index > 3 && index <= options.level + 1 && item !== "--debug";
  });
  program2.parse(commands);
};
const pushCommand = () => {
  subCommandCompiler((program2) => {
    program2.command("push").description("将本地分支推送到远程仓库").action(() => {
      pushService();
    });
  });
};
const pullService = async (options) => {
  if (!await isGitProject()) {
    logger.error("当前目录不是 Git 项目");
    return;
  }
  try {
    const currentBranch = await getCurrentBranchName();
    if (!currentBranch) {
      logger.error("无法获取当前分支名称");
      return;
    }
    logger.info(`当前分支: ${chalk.green(currentBranch)}`);
    logger.info("正在拉取代码...");
    await executeCommands([gitAtom.pull()]);
    logger.success(`成功拉取分支 ${chalk.green(currentBranch)} 的最新代码`);
  } catch (error2) {
    logger.error(`拉取失败: ${error2.message || error2}`);
  }
};
const pullCommand = () => {
  subCommandCompiler((program2) => {
    program2.command("pull").description("从远程仓库拉取最新代码").action((options) => {
      pullService();
    });
  });
};
const hasChanges = async () => {
  try {
    const { stdout } = await execaCommand("git status -s");
    return stdout.trim() !== "";
  } catch (error2) {
    logger.error("检查未提交更改失败");
    return false;
  }
};
const executeBaseManagers = async (commitMessage, currentBranch) => {
  logger.info("执行基础Git命令...");
  try {
    const gitStatus = await getGitProjectStatus();
    if (gitStatus.status === GitStatusMap.Uncommitted) {
      await executeCommands(["git add .", gitAtom.commit(commitMessage)], { silentStart: true });
    }
    let isBranchPushed = await isCurrenetBranchPushed();
    if (isBranchPushed) {
      await executeCommands([gitAtom.pull()], { silentStart: true });
      if (await hasChanges()) {
        await executeCommands(["git add .", gitAtom.commit("合并代码")], { silentStart: true });
      }
    }
    if (isBranchPushed) {
      await executeCommands([gitAtom.push()], { silentStart: true });
    } else {
      await executeCommands([gitAtom.push(true, currentBranch)], { silentStart: true });
    }
    logger.success("基础Git命令执行完成");
  } catch (error2) {
    logger.error("基础Git命令执行失败，部署结束。");
    throw error2;
  }
};
const mergeToBranch = async (targetBranch, currentBranch, switchBackToBranch = false) => {
  logger.info(`合并代码到 ${targetBranch} 分支...`);
  try {
    await execaCommand(`git checkout ${targetBranch}`);
    await executeCommands([gitAtom.pull(), gitAtom.merge(currentBranch), gitAtom.push()]);
    if (switchBackToBranch) {
      await execaCommand(`git checkout ${currentBranch}`);
    }
    logger.success(`代码已成功合并到 ${targetBranch} 分支`);
  } catch (error2) {
    if (switchBackToBranch) {
      try {
        await execaCommand(`git checkout ${currentBranch}`);
      } catch (checkoutError) {
        logger.error("切回原始分支失败");
      }
    }
    logger.error(`合并到 ${targetBranch} 分支失败`);
    throw error2;
  }
};
const initBranchInfo = async () => {
  const isGit = await isGitProject();
  if (!isGit) {
    throw new Error("当前目录不是Git项目");
  }
  const currentBranch = await getCurrentBranchName();
  if (!currentBranch) {
    throw new Error("获取当前分支失败");
  }
  let mainBranch = await getMainBranchName();
  if (!mainBranch) {
    mainBranch = "master";
  }
  return { currentBranch, mainBranch };
};
const handleUserInput = async (options) => {
  const changed = await hasChanges();
  if (!changed && !options.commit) {
    const { commitMessage } = await inquirer.prompt([
      {
        type: "input",
        name: "commitMessage",
        message: "请输入commit信息:",
        validate: (input) => !!input || "提交信息不能为空"
      }
    ]);
    return commitMessage;
  }
  return options.commit;
};
const openDeployPage = async (type, isOnline) => {
  const { id, name, onlineId, onlineName } = await getProjectName(type);
  if (id) {
    const origin = await readSecret((db) => db.jenkins.url.internal);
    await open(
      `http://${origin}/view/${isOnline ? onlineName || name : name}/job/${isOnline ? onlineId || id : id}/`,
      { wait: true }
    );
  }
};
const getProjectName = async (type) => {
  const projectConf = await readPackage({
    cwd: process.cwd()
  });
  const finded = projectConf.jenkins;
  if (Array.isArray(finded)) {
    const jenkins2 = type && type !== "v" ? finded.find((item) => item.type === type) : finded.find((item) => !item.type);
    if (!jenkins2) {
      return {
        name: "",
        id: "",
        onlineId: "",
        onlineName: ""
      };
    }
    return {
      ...jenkins2,
      onlineId: jenkins2.onlineId || jenkins2.id.replace(/[-_]test$/, "")
    };
  }
  const jenkins = finded;
  if (!jenkins) {
    return {
      name: "",
      id: "",
      onlineId: ""
    };
  }
  return {
    ...jenkins,
    onlineId: jenkins.onlineId || jenkins.id.replace(/[-_]test$/, "")
  };
};
const updateLastTag = async (type, newTag) => {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  if (fs$1.existsSync(pkgPath)) {
    const pkgContent = await fs$1.promises.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(pkgContent);
    if (pkg.jenkins) {
      if (Array.isArray(pkg.jenkins)) {
        const targetType = type && type !== "v" ? type : void 0;
        const jenkinsItem = pkg.jenkins.find(
          (item) => item.type === targetType || !targetType && !item.type
        );
        if (jenkinsItem) {
          jenkinsItem.lastTag = newTag;
        }
      } else {
        pkg.jenkins.lastTag = newTag;
      }
      await fs$1.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    }
  }
};
const parseVersion = (tag, type) => {
  const versionStr = tag.substring(type.length);
  const fourPartMatch = versionStr.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (fourPartMatch) {
    return {
      prefix: type,
      major: parseInt(fourPartMatch[1]),
      minor: parseInt(fourPartMatch[2]),
      patch: parseInt(fourPartMatch[3]),
      build: parseInt(fourPartMatch[4])
    };
  }
  const threePartMatch = versionStr.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (threePartMatch) {
    return {
      prefix: type,
      major: parseInt(threePartMatch[1]),
      minor: parseInt(threePartMatch[2]),
      patch: parseInt(threePartMatch[3])
    };
  }
  return null;
};
const findMaxVersion = (versions) => {
  return versions.reduce((max, current) => {
    if (current.major > max.major) {
      return current;
    }
    if (current.major === max.major) {
      if (current.minor > max.minor) {
        return current;
      }
      if (current.minor === max.minor) {
        if (current.patch > max.patch) {
          return current;
        }
        if (current.patch === max.patch) {
          const currentBuild = current.build || 0;
          const maxBuild = max.build || 0;
          if (currentBuild > maxBuild) {
            return current;
          }
        }
      }
    }
    return max;
  }, versions[0]);
};
const createInitialVersion = (type, version2) => {
  return version2 ? `${type}${version2}` : `${type}1.0.0`;
};
const createSpecifiedVersion = (type, version2, maxVersion) => {
  if (!semver.valid(version2)) {
    throw new Error(`无效的版本号格式: ${version2}，请使用三段式版本号如 1.0.0`);
  }
  const currentMax = `${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}`;
  if (semver.lt(version2, currentMax)) {
    throw new Error(`指定的版本号 ${version2} 小于当前最新版本 ${currentMax}`);
  }
  return `${type}${version2}`;
};
const isVersionGreaterOrEqual = (v1, v2) => {
  if (v1.major !== v2.major) return v1.major > v2.major;
  if (v1.minor !== v2.minor) return v1.minor > v2.minor;
  if (v1.patch !== v2.patch) return v1.patch > v2.patch;
  const b1 = v1.build || 0;
  const b2 = v2.build || 0;
  return b1 >= b2;
};
const createIncrementedVersion = (type, maxVersion, lastTagVersion) => {
  if (lastTagVersion && lastTagVersion.build !== void 0 && isVersionGreaterOrEqual(lastTagVersion, maxVersion)) {
    return `${type}${lastTagVersion.major}.${lastTagVersion.minor}.${lastTagVersion.patch}.${lastTagVersion.build + 1}`;
  }
  if (maxVersion.build !== void 0) {
    return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.${maxVersion.build + 1}`;
  } else {
    return `${type}${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}.1`;
  }
};
const generateNewTag = async (tags, type = "v", version2) => {
  const prefixedTags = tags.filter((tag) => tag.startsWith(type));
  if (prefixedTags.length === 0) {
    return { newTag: createInitialVersion(type, version2), shouldUpdateLastTag: false };
  }
  const versions = prefixedTags.map((tag) => parseVersion(tag, type)).filter((v) => v !== null);
  if (versions.length === 0) {
    return { newTag: createInitialVersion(type, version2), shouldUpdateLastTag: false };
  }
  const maxVersion = findMaxVersion(versions);
  if (version2) {
    return { newTag: createSpecifiedVersion(type, version2, maxVersion), shouldUpdateLastTag: false };
  } else {
    const jenkinsConfig = await getProjectName(type);
    const lastTagVersion = jenkinsConfig.lastTag ? parseVersion(jenkinsConfig.lastTag, type) : null;
    return { newTag: createIncrementedVersion(type, maxVersion, lastTagVersion), shouldUpdateLastTag: true };
  }
};
const tagService = async (options) => {
  if (!await isGitProject()) {
    logger.error("当前目录不是 Git 项目");
    return;
  }
  const { version: version2, type = "v" } = options;
  try {
    const tags = await getAllTags();
    if (tags.length === 0) {
      logger.info("当前项目没有标签");
      return;
    }
    const { newTag, shouldUpdateLastTag } = await generateNewTag(tags, type, version2);
    logger.info(`正在创建标签: ${chalk.green(newTag)}`);
    await executeCommands([
      {
        message: `git tag ${newTag}`,
        onError: async () => {
          return {
            shouldStop: true
          };
        }
      },
      {
        message: `git push origin ${newTag}`,
        onError: async (message) => {
          if (message.includes("not found")) {
            console.warn(`远程仓库不存在标签: ${newTag}`);
          }
          return {
            shouldStop: false
          };
        }
      }
    ]);
    if (shouldUpdateLastTag) {
      await updateLastTag(type, newTag);
    }
    const { onlineId } = await getProjectName(type);
    const copyText = `${onlineId}, tag:${newTag}${options.msg ? `，更新内容：${options.msg}。` : "。"}`;
    logger.success(`创建成功，复制项目信息 ${chalk.green(copyText)}`);
    clipboardy.writeSync(copyText);
  } catch (error2) {
    logger.error(`创建标签失败: ${error2.message || error2}`);
  }
};
const handleTagAndOutput = async (options, readFromPackage = false) => {
  let version2 = options.version;
  if (!version2 && readFromPackage) {
    try {
      const pkgPath = path.resolve(process.cwd(), "package.json");
      if (await fs.pathExists(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        version2 = pkg.version;
      }
    } catch (error2) {
    }
  }
  const tagOptions = {
    type: options.type,
    version: version2,
    msg: options.commit
  };
  await tagService(tagOptions);
};
const handleMasterBranch = async (options, currentBranch) => {
  if (!options.current) {
    logger.warn("当前分支为master，将要发布项目");
    await sleep(1500);
  }
  await executeBaseManagers(options.commit, currentBranch);
  if (!options.current) {
    await handleTagAndOutput(options);
  }
  if (options.open) {
    await openDeployPage(options.type, true);
  }
};
const handleReleaseBranch = async (options, currentBranch) => {
  await executeBaseManagers(options.commit, currentBranch);
  if (options.open !== false) {
    await openDeployPage(options.type);
  }
};
const handleOtherBranch$1 = async (options, currentBranch, mainBranch) => {
  await executeBaseManagers(options.commit, currentBranch);
  if (options.prod) {
    const { confirmDeploy } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDeploy",
        message: `确认要发布项目吗？这将合并代码到${mainBranch}分支并发布`,
        default: false
      }
    ]);
    if (!confirmDeploy) {
      logger.info("已取消发布操作");
      return;
    }
    await mergeToBranch(mainBranch, currentBranch, false);
    await handleTagAndOutput(options, true);
  } else if (!options.current) {
    await mergeToBranch("release", currentBranch, true);
    if (options.open !== false) {
      await openDeployPage(options.type);
    }
  }
};
const companyDeploy = async (options, currentBranch, mainBranch) => {
  if (currentBranch === mainBranch) {
    await handleMasterBranch(options, currentBranch);
  } else if (currentBranch === "release") {
    await handleReleaseBranch(options, currentBranch);
  } else {
    await handleOtherBranch$1(options, currentBranch, mainBranch);
  }
};
const executeGithubGitFlow = async (commitMessage, currentBranch) => {
  logger.info("执行 Github 项目基础 Git 命令 (Push First)...");
  try {
    const gitStatus = await getGitProjectStatus();
    if (gitStatus.status === GitStatusMap.Uncommitted) {
      await executeCommands(["git add .", gitAtom.commit(commitMessage)], { silentStart: true });
    }
    const isBranchPushed = await isCurrenetBranchPushed();
    if (!isBranchPushed) {
      await executeCommands([gitAtom.push(true, currentBranch)], { silentStart: true });
    } else {
      await executeCommands(
        [
          {
            message: "git push",
            maxAttempts: 3,
            onError: async (err) => {
              const error2 = err.toLowerCase();
              if (error2.includes("updates were rejected") || error2.includes("fetch first") || error2.includes("contains work that you do not have locally")) {
                logger.info("检测到远程分支有更新，正在拉取代码...");
                try {
                  await executeCommands([gitAtom.pull()], { silentStart: true });
                  if (await hasChanges()) {
                    await executeCommands(["git add .", gitAtom.commit("Merge remote changes")], {
                      silentStart: true
                    });
                  }
                  return { shouldStop: false };
                } catch (pullError) {
                  logger.error("拉取代码失败，请手动解决冲突");
                  return { shouldStop: true };
                }
              }
              return { shouldStop: false };
            }
          }
        ],
        { silentStart: true }
      );
    }
    logger.success("Github 项目基础 Git 命令执行完成");
  } catch (error2) {
    logger.error("Github 项目基础 Git 命令执行失败，部署结束。");
    throw error2;
  }
};
const handleMainBranch = async (options, currentBranch) => {
  await executeGithubGitFlow(options.commit, currentBranch);
};
const handleOtherBranch = async (options, currentBranch, mainBranch) => {
  await executeGithubGitFlow(options.commit, currentBranch);
  if (options.prod) {
    await mergeToBranch(mainBranch, currentBranch, false);
  }
};
const githubDeploy = async (options, currentBranch, mainBranch) => {
  if (currentBranch === mainBranch) {
    await handleMainBranch(options, currentBranch);
  } else {
    await handleOtherBranch(options, currentBranch, mainBranch);
  }
};
const deployService = async (options) => {
  try {
    options.commit = options.commit || "update";
    const commitMsg = await handleUserInput(options);
    options.commit = commitMsg;
    const { currentBranch, mainBranch } = await initBranchInfo();
    const isGithub = await isGithubProject();
    if (isGithub) {
      await githubDeploy(options, currentBranch, mainBranch);
    } else {
      await companyDeploy(options, currentBranch, mainBranch);
    }
    logger.success("部署流程已完成");
  } catch (error2) {
    if (error2 instanceof Error) {
      if (error2.message !== "exit") {
        logger.error(error2.message);
      }
    } else {
      logger.error("部署过程中发生未知错误");
    }
    process.exit(1);
  }
};
const deployCommand = () => {
  subCommandCompiler((program2) => {
    program2.command("deploy").description("一次性完成git代码提交、拉取、推送等功能").option("--prod", "是否发布到master或main分支").option("--type <type>", "项目类型，用于标记tag").option("--version <version>", "项目版本号，用于标记tag").option("--open", "是否打开对应的jenkins主页").option("-c, --current", "仅完成基础命令后结束任务").option("--msg", "是否复制提交消息到剪贴板").option("--commit [message]", "git commit提交信息").action((options) => {
      deployService(options);
    });
  });
};
const renderBranchList = async (params) => {
  const list = await getAllBranches();
  const branches = list.reduce((acc, branchItem) => {
    let type = chalk.cyan("all");
    if (branchItem.hasLocal && !branchItem.hasRemote) {
      type = chalk.yellow("local");
    } else if (!branchItem.hasLocal && branchItem.hasRemote) {
      type = chalk.blue("remote");
    }
    return acc.concat({
      name: branchItem.name,
      type,
      createTime: branchItem.createTime
    });
  }, []);
  const table = new Table({
    head: ["名称", "类型", "创建时间"]
  });
  table.push(
    ...branches.map((item) => {
      return [item.name, item.type, item.createTime];
    })
  );
  console.log(table.toString());
};
const branchService = async (options) => {
  await renderBranchList({
    keyword: options.key
  });
};
const branchDeleteService = async () => {
  const branches = (await getAllBranches()).reduce((acc, branchItem) => {
    if (["master", "main", "release"].includes(branchItem.name)) {
      return acc;
    }
    let output = branchItem.name;
    if (branchItem.hasLocal && branchItem.hasRemote) {
      output += chalk.cyan("(all)");
    } else if (branchItem.hasLocal) {
      output += chalk.yellow("(local)");
    } else {
      output += chalk.blue("(remote)");
    }
    return acc.concat({
      name: output,
      value: branchItem.name,
      hasLocal: branchItem.hasLocal,
      hasRemote: branchItem.hasRemote,
      createTime: branchItem.createTime
    });
  }, []);
  let selected = [];
  const answer = await inquirer.prompt({
    message: "请选择要删除的分支",
    type: "checkbox",
    choices: branches,
    name: "selected"
  });
  selected = answer.selected;
  if (!selected.length) {
    logger.error("您没有选择任何标签，已退出");
    return;
  }
  spinner.text = "正在删除所选分支";
  const errorBranches = [];
  const selectedItems = selected.map((sel) => branches.find((item) => item.value === sel));
  await pMap(
    selectedItems,
    async (branchItem) => {
      if (branchItem.hasLocal) {
        try {
          await deleteBranch$1({
            branchName: branchItem.value
          });
        } catch (error2) {
          errorBranches.push(branchItem);
          return;
        }
      }
      if (branchItem.hasRemote) {
        try {
          await deleteBranch$1({
            remote: true,
            branchName: branchItem.value
          });
        } catch (error2) {
          errorBranches.push(branchItem);
          return;
        }
      }
    },
    { concurrency: 4 }
  );
  spinner.stop();
  if (!errorBranches.length) {
    logger.success("删除成功");
    return;
  }
  const handleFailedBranchesAnswer = await inquirer.prompt({
    type: "confirm",
    name: "handleFailedBranches",
    message: "是否处理删除失败的分支？",
    default: false
  });
  if (!handleFailedBranchesAnswer.handleFailedBranches) {
    logger.warn("已取消处理删除失败的分支");
    return;
  }
  const branchesWithUnpushedCommits = [];
  const branchesWithoutUnpushedCommits = [];
  for (const branch of errorBranches) {
    try {
      const { stdout } = await execaCommand(`git log origin/${branch.value}..${branch.value}`);
      if (stdout.trim()) {
        branchesWithUnpushedCommits.push(branch);
      } else {
        branchesWithoutUnpushedCommits.push(branch);
      }
    } catch (error2) {
      branchesWithoutUnpushedCommits.push(branch);
    }
  }
  if (branchesWithUnpushedCommits.length > 0) {
    logger.warn("以下分支有未推送的 commit：");
    branchesWithUnpushedCommits.forEach((branch) => {
      logger.warn(`- ${branch.name}`);
    });
    const pushAnswer = await inquirer.prompt({
      type: "confirm",
      name: "pushBranches",
      message: "是否推送这些分支的 commit？",
      default: false
    });
    if (pushAnswer.pushBranches) {
      let pushSuccess = false;
      for (const branch of branchesWithUnpushedCommits) {
        try {
          await execaCommand(`git push origin ${branch.value}`);
          logger.success(`已推送分支 ${branch.name}`);
          pushSuccess = true;
        } catch (error2) {
          logger.error(`推送分支 ${branch.name} 失败`);
        }
      }
      if (pushSuccess) {
        for (const branch of branchesWithUnpushedCommits) {
          await Promise.all([
            deleteBranch$1({
              branchName: branch.value
            }),
            deleteBranch$1({
              remote: true,
              branchName: branch.value
            })
          ]);
        }
      }
    } else {
      logger.warn("已取消推送未提交的分支");
      return;
    }
  }
  if (branchesWithoutUnpushedCommits.length > 0) {
    logger.warn("以下分支没有未推送的 commit：");
    branchesWithoutUnpushedCommits.forEach((branch) => {
      logger.warn(`- ${branch.name}`);
    });
    const forceDeleteAnswer = await inquirer.prompt({
      type: "confirm",
      name: "forceDelete",
      message: "是否强制删除这些分支？",
      default: false
    });
    if (forceDeleteAnswer.forceDelete) {
      for (const branch of branchesWithoutUnpushedCommits) {
        try {
          await Promise.all([
            deleteBranch$1({
              branchName: branch.value,
              force: true
            }),
            deleteBranch$1({
              branchName: branch.value,
              remote: true,
              force: true
            })
          ]);
          logger.success(`已强制删除分支 ${branch.name}`);
        } catch (error2) {
          logger.error(`强制删除分支 ${branch.name} 失败`);
        }
      }
    } else {
      logger.warn("已取消强制删除分支");
    }
  }
  if (spinner.isSpinning) {
    spinner.succeed("删除成功");
  }
};
const get$1 = () => {
  subCommandCompiler((program2) => {
    program2.description("查看Git分支").option("--head <number>", "查看最近的几个提交，默认查看最近3个").option("--path <path>", "指定查看的文件目录").action((options) => {
      branchService(options);
    });
  });
};
const deleteBranch = () => {
  subCommandCompiler(
    (program2) => {
      program2.command("delete").description("删除Git分支").action(() => {
        console.log(12);
        branchDeleteService();
      });
    },
    { level: 3 }
  );
};
const branchCommand = function(restCommand) {
  const commandMap = {
    delete: deleteBranch
  };
  if (!restCommand.length) {
    get$1();
  } else if (commandMap[restCommand[0]]) {
    commandMap[restCommand[0]]();
  } else {
    console.log(`未知的 git branch 子命令: ${restCommand[0]}`);
    console.log("可用的子命令: " + Object.keys(commandMap).join(", "));
  }
};
const commitService = async (message, options) => {
  if (!await isGitProject()) {
    logger.error("当前目录不是 Git 项目");
    return;
  }
  try {
    await executeCommands([
      `git add ${options.path ? options.path.replace(/\\/g, "/") || "." : "."}`,
      gitAtom.commit(message)
    ]);
    logger.success("提交成功");
  } catch (error2) {
    logger.error(`提交失败: ${error2.message || error2}`);
  }
};
const commitCommand = () => {
  subCommandCompiler((program2) => {
    program2.command("commit <data>").description("提交Git代码").option("--path <path>", "指定要提交的文件路径，默认当前目录").action((data, options) => {
      commitService(data, options);
    });
  });
};
const cloneService = async (options) => {
  const { repo, dir } = options;
  try {
    logger.info(`正在克隆仓库: ${chalk.green(repo)}`);
    if (dir) {
      logger.info(`目标目录: ${chalk.green(dir)}`);
    }
    await executeCommands([gitAtom.clone(repo, dir)]);
    logger.success("仓库克隆成功");
  } catch (error2) {
    logger.error(`克隆失败: ${error2.message || error2}`);
  }
};
const cloneCommand = function() {
  subCommandCompiler((program2) => {
    program2.command("clone <repo>").description("克隆远程仓库").option("--dir <dir>", "指定目标目录").action((repo, options) => {
      cloneService({ repo, dir: options.dir });
    });
  });
};
let bar;
const progress = {
  setTotal(total) {
    bar = new Progress(":bar :current/:total", {
      total,
      width: 80,
      complete: chalk.bgGreen(" "),
      incomplete: " "
    });
  },
  tick() {
    bar.tick();
  }
};
function parseSlashCommand(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }
  const content = trimmed.slice(1).trim();
  if (!content) {
    return null;
  }
  const parts = content.split(/\s+/).filter(Boolean);
  const command = parts.shift();
  if (!command) {
    return null;
  }
  return {
    command,
    args: parts
  };
}
function createCommandReadline(commands, options = {}) {
  const prompt = options.prompt ?? "> ";
  const exitCommand = options.exitCommand ?? "exit";
  const commandMap = /* @__PURE__ */ new Map();
  for (const cmd of commands) {
    commandMap.set(cmd.name, cmd);
  }
  const displayLines = [];
  for (const cmd of commands) {
    const usage = cmd.usage ? ` ${cmd.usage}` : "";
    const desc = cmd.description ? ` - ${cmd.description}` : "";
    displayLines.push(`/${cmd.name}${usage}${desc}`);
  }
  displayLines.push(`/${exitCommand} - 退出`);
  console.log(chalk.yellow(displayLines.join("\n")));
  const rl = readline.createInterface({
    input: options.input ?? process.stdin,
    output: options.output ?? process.stdout,
    terminal: options.terminal ?? true
  });
  rl.setPrompt(prompt);
  rl.prompt();
  const ctxBase = { rl };
  const handleLine = async (line) => {
    const parsed = parseSlashCommand(line);
    if (!parsed) {
      rl.prompt();
      return;
    }
    if (parsed.command === exitCommand) {
      rl.close();
      return;
    }
    const cmd = commandMap.get(parsed.command);
    if (!cmd) {
      console.log(chalk.red(`未知命令: /${parsed.command}`));
      rl.prompt();
      return;
    }
    rl.pause();
    try {
      await cmd.handler(parsed.args, { ...ctxBase, line });
    } catch (err) {
      console.log(chalk.red(`命令执行失败: /${cmd.name}`));
      console.log(String(err));
    } finally {
      rl.resume();
      rl.prompt();
    }
  };
  rl.on("line", (line) => {
    void handleLine(line);
  });
  rl.on("SIGINT", () => {
    rl.close();
  });
  return new Promise((resolve2) => {
    rl.on("close", () => {
      resolve2();
    });
  });
}
const getGitLogData = async (options) => {
  const cwd = options.cwd || process.cwd();
  let head = 0;
  if (options.head) {
    head = options.head;
  } else {
    const unPushed = await execaCommand("git log --oneline --not --branches", { cwd });
    head = unPushed.stdout.split("\n").length || 3;
  }
  const arr = await splitGitLog(head, cwd);
  const output = await pMap(
    arr,
    async (item) => {
      const branch = await execaCommand(`git branch --contains ${item.id}`, { cwd });
      const detail = await execaCommand(`git show --name-only ${item.id}`, { cwd });
      const detailList = detail.stdout.split("\n");
      const files = [];
      for (let i = detailList.length - 1; i >= 0; i--) {
        const line = detailList[i];
        if (!!line) {
          files.push(line);
        } else {
          break;
        }
      }
      return {
        ...item,
        branch: branch.stdout.split("\n").slice(-1)[0].trim().replace("* ", ""),
        files
      };
    },
    { concurrency: 3 }
  );
  return output;
};
const logService = async (options) => {
  spinner.text = "正在获取Git日志";
  const output = await getGitLogData(options);
  spinner.succeed("Git日志获取成功");
  output.forEach((item) => {
    console.log(`------------------------`);
    console.log(`${chalk.green(`[${item.branch}分支]`)} ${chalk.yellow(item.date)} ${item.message}`);
    if (options.path) {
      item.files.forEach((file) => {
        if (file.startsWith(options.path)) {
          console.log(`${chalk.blue(file)}`);
        } else {
          console.log(file);
        }
      });
    } else {
      console.log(item.files.join("\n"));
    }
  });
};
const getStatusMap = (status) => {
  const map2 = {
    1: chalk.red("未提交"),
    2: chalk.yellow("未推送"),
    3: chalk.green("正常"),
    4: chalk.gray("不在主分支上")
  };
  return map2[status] || String(status);
};
const printProjectTable = (list) => {
  const table = new Table({
    head: ["名称", "地址", "状态", "分支"],
    colAligns: ["left", "left", "left", "left"]
  });
  table.push(
    ...list.map((item, index) => [
      `${index + 1}. ${basename(item.path)}`,
      item.path,
      `${getStatusMap(item.status)}`,
      item.branchName
    ])
  );
  console.log(table.toString());
};
const printProjectLog = async (item) => {
  console.log(chalk.bold.cyan(`
项目: ${item.path} (${item.branchName})`));
  try {
    let head = 3;
    try {
      const { stdout } = await execaCommand("git rev-list --count @{u}..HEAD", { cwd: item.path });
      head = parseInt(stdout.trim(), 10) || 3;
    } catch {
    }
    if (head === 0) head = 3;
    const logs = await getGitLogData({ cwd: item.path, head });
    if (logs.length === 0) {
      console.log(chalk.gray("  没有未推送的提交记录"));
      return;
    }
    logs.forEach((log) => {
      console.log(`  ${chalk.green(`[${log.branch}分支]`)} ${chalk.yellow(log.date)} ${log.message}`);
      if (log.files && log.files.length) {
        log.files.forEach((file) => {
          console.log(`    ${chalk.gray(file)}`);
        });
      }
    });
  } catch (e) {
    console.log(chalk.red(`  获取日志失败: ${e.message}`));
  }
};
const scanService = async (options) => {
  const { full } = options;
  logger.info("开始扫描");
  const gitDirs = await sql(async (db) => db.gitDirs);
  const allDirs = await pReduce(
    gitDirs,
    async (acc, dir) => {
      try {
        const dirs = await fsp.readdir(dir.path);
        return acc.concat(
          await pMap(
            dirs,
            async (subDir) => ({
              dir: subDir,
              prefix: dir.path,
              folderName: dir.name
            }),
            { concurrency: 4 }
          )
        );
      } catch (error2) {
        return acc;
      }
    },
    []
  );
  progress.setTotal(allDirs.length);
  const scannedList = await pMap(
    allDirs,
    async (dirInfo) => {
      const fullPath = join(dirInfo.prefix, dirInfo.dir);
      try {
        const { status, branchName } = await getGitProjectStatus(fullPath);
        progress.tick();
        return {
          path: fullPath,
          status,
          branchName
        };
      } catch (error2) {
        progress.tick();
        return {
          path: fullPath,
          status: 3,
          // 默认为正常，避免中断流程
          branchName: ""
        };
      }
    },
    { concurrency: 4 }
  );
  const srcList = scannedList.filter(
    (item) => [GitStatusMap.Uncommitted, GitStatusMap.Unpushed, GitStatusMap.NotOnMainBranch].includes(item.status)
  );
  logger.backwardConsole(2);
  const list = srcList.filter((item) => {
    if (full) {
      return true;
    }
    return item.status !== 4;
  });
  if (list.length === 0) {
    logger.success("恭喜！没有项目需要提交或推送。");
    return;
  }
  printProjectTable(list);
  const getItem = (indexStr) => {
    const index = parseInt(indexStr, 10);
    if (isNaN(index) || index < 1 || index > list.length) {
      return null;
    }
    return list[index - 1];
  };
  const commands = [
    {
      name: "diff",
      usage: "<x>",
      description: "查看项目修改。如果超出20行，则用code打开。",
      handler: async (args) => {
        const item = getItem(args[0]);
        if (!item) {
          console.log(chalk.red("请输入有效的项目编号 (1-" + list.length + ")"));
          return;
        }
        try {
          const { stdout: status } = await execaCommand("git status --porcelain", { cwd: item.path });
          if (!status.trim()) {
            console.log(chalk.green("没有要提交的代码"));
            return;
          }
          const { stdout: diff } = await execaCommand("git diff HEAD", { cwd: item.path });
          const lines = diff.split("\n");
          if (lines.length > 20) {
            const fileCount = status.trim().split("\n").length;
            console.log(chalk.yellow(`修改了 ${fileCount} 个文件`));
            console.log(chalk.blue(`正在用 VS Code 打开: ${item.path}`));
            await execa("code", [item.path]);
          } else {
            console.log(diff);
          }
        } catch (e) {
          console.log(chalk.red(`执行 diff 失败: ${e.message}`));
        }
      }
    },
    {
      name: "commit",
      usage: "<x> <message>",
      description: "提交代码",
      handler: async (args) => {
        if (args.length < 2) {
          console.log(chalk.red("参数不足: /commit <x> <message>"));
          return;
        }
        const item = getItem(args[0]);
        if (!item) {
          console.log(chalk.red("请输入有效的项目编号 (1-" + list.length + ")"));
          return;
        }
        const message = args.slice(1).join(" ");
        try {
          await execaCommand("git add .", { cwd: item.path });
          await execa("git", ["commit", "-m", message], { cwd: item.path });
          console.log(chalk.green(`提交成功: ${message}`));
        } catch (e) {
          console.log(chalk.red(`提交失败: ${e.message}`));
        }
      }
    },
    {
      name: "log",
      usage: "[x]",
      description: "查看已提交未推送的commit",
      handler: async (args) => {
        if (args.length > 0) {
          const item = getItem(args[0]);
          if (!item) {
            console.log(chalk.red("请输入有效的项目编号 (1-" + list.length + ")"));
            return;
          }
          await printProjectLog(item);
        } else {
          for (const item of list) {
            await printProjectLog(item);
          }
        }
      }
    },
    {
      name: "push",
      usage: "[x]",
      description: "推送代码",
      handler: async (args) => {
        const pushItem = async (item) => {
          try {
            console.log(chalk.blue(`正在推送: ${basename(item.path)} ...`));
            await execaCommand("git push", { cwd: item.path });
            console.log(chalk.green(`推送成功: ${basename(item.path)}`));
          } catch (e) {
            console.log(chalk.red(`推送失败 (${basename(item.path)}): ${e.message}`));
          }
        };
        if (args.length > 0) {
          const item = getItem(args[0]);
          if (!item) {
            console.log(chalk.red("请输入有效的项目编号 (1-" + list.length + ")"));
            return;
          }
          await executeCommands([gitAtom.push()], { cwd: item.path });
        } else {
          const unpushed = list.filter((i) => i.status === GitStatusMap.Unpushed);
          if (unpushed.length === 0) {
            console.log(chalk.yellow('没有发现需要推送的项目 (状态为"未推送")'));
            return;
          }
          for (const item of unpushed) {
            await pushItem(item);
          }
        }
      }
    }
  ];
  await createCommandReadline(commands, {
    prompt: "git-scan> ",
    exitCommand: "exit"
  });
};
const scanCommand = () => {
  subCommandCompiler((program2) => {
    program2.command("scan").description("扫描Git分支").option("--full", "是否全量扫描").action((options) => {
      scanService(options);
    });
  });
};
const mergeService = async (options) => {
  if (!await isGitProject()) {
    logger.error("当前目录不是 Git 项目");
    return;
  }
  const { head } = options;
  console.log(`您将要合并最近${head}个提交`);
  const arr = await splitGitLog(head);
  const table = new Table({
    head: ["日期", "提交内容"],
    colWidths: [30, 60]
  });
  arr.forEach((item) => {
    table.push([item.date, item.message]);
  });
  console.log(table.toString());
  const answer = await inquirer.prompt({
    type: "input",
    message: `请输入合并后的提交信息，默认使用最近一次的提交信息`,
    name: "commitMessage"
  });
  const commitMessage = fmtCommitMsg(
    answer.commitMessage !== "" ? answer.commitMessage : arr[0].message.replace(/\w+\:/g, "")
  );
  await execaCommand(`git reset --soft HEAD~${head}`);
  await execaCommand("git add .");
  await execaCommand(gitAtom.commit(commitMessage).message);
  console.log(chalk.green("合并完成"));
};
const mergeCommand = () => {
  subCommandCompiler((program2) => {
    program2.command("merge").description("合并最近的提交").option("--head <number>", "合并最近的几个提交，默认合并最近3个").action((options) => {
      mergeService(options);
    });
  });
};
const logCommand = () => {
  subCommandCompiler((program2) => {
    program2.command("log").description("查看Git提交日志").option("--head <number>", "查看最近的几个提交，默认查看最近3个").option("--path <path>", "指定查看的文件目录").action((options) => {
      logService(options);
    });
  });
};
const fetchTags = () => {
  return {
    message: "git fetch --tags",
    onError: async (message) => {
      console.error(`拉取远程标签失败: ${message}`);
      return {
        shouldStop: true
      };
    }
  };
};
const tagSyncService = async () => {
  if (!await isGitProject()) {
    logger.error("当前目录不是 Git 项目");
    return;
  }
  try {
    const tags = await getAllTags();
    if (tags.length > 0) {
      logger.info(`正在删除 ${tags.length} 个本地标签...`);
      await execa("git", ["tag", "-d"].concat(tags));
    }
    logger.info("正在从远程拉取所有标签...");
    await executeCommands([fetchTags()]);
    const updatedTags = await getAllTags();
    logger.success(`标签同步完成，现有 ${updatedTags.length} 个标签`);
  } catch (error2) {
    logger.error(`同步标签失败: ${error2.message || error2}`);
  }
};
const tagDeleteService = async () => {
  if (!await isGitProject()) {
    logger.error("当前目录不是 Git 项目");
    return;
  }
  try {
    const tags = await getAllTags();
    if (tags.length === 0) {
      logger.warn("当前项目没有标签");
      return;
    }
    const { selectedTags } = await inquirer.prompt({
      type: "checkbox",
      name: "selectedTags",
      message: "请选择要删除的标签",
      choices: tags.map((tag) => ({ name: tag, value: tag }))
    });
    if (!selectedTags.length) {
      logger.info("未选择任何标签，操作已取消");
      return;
    }
    logger.info(`正在删除选中的 ${selectedTags.length} 个标签...`);
    await deleteTags({ tags: selectedTags, remote: true });
    logger.success("标签删除操作完成");
  } catch (error2) {
    logger.error(`删除标签失败: ${error2.message || error2}`);
  }
};
const get = () => {
  subCommandCompiler((program2) => {
    program2.command("tag").description("管理Git标签").option("--version <version>", "设置版本号").option("--type <type>", "设置标签类型前缀，默认为v").option("--msg", "是否复制提交消息到剪贴板").action((options) => {
      tagService(options);
    });
  });
};
const deleteTag = () => {
  subCommandCompiler((program2) => {
    program2.command("delete").description("删除Git分支").action(() => {
      tagDeleteService();
    });
  });
};
const syncTag = () => {
  subCommandCompiler((program2) => {
    program2.command("sync").description("同步Git标签").action(() => {
      tagSyncService();
    });
  });
};
const tagCommand = function(subCommand) {
  const commandMap = {
    delete: deleteTag,
    sync: syncTag
  };
  if (!subCommand) {
    get();
  } else if (commandMap[subCommand]) {
    commandMap[subCommand]();
  } else {
    console.log(`未知的 git tag 子命令: ${subCommand}`);
    console.log("可用的子命令: " + Object.keys(commandMap).join(", "));
  }
};
const gitCommand = function(subCommand, nextCommand) {
  const commandMap = {
    push: pushCommand,
    pull: pullCommand,
    commit: commitCommand,
    tag: tagCommand,
    deploy: deployCommand,
    branch: branchCommand,
    scan: scanCommand,
    merge: mergeCommand,
    log: logCommand,
    clone: cloneCommand
  };
  if (commandMap[subCommand]) {
    commandMap[subCommand](nextCommand);
  } else {
    console.log(`未知的 git 子命令: ${subCommand}`);
    console.log("可用的子命令: " + Object.keys(commandMap).join(", "));
  }
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
program.command("git [sub-command] [rest...]").allowUnknownOption().action((subCommand) => {
  gitCommand(subCommand);
});
program.parse(process.argv.filter((cmd) => ["--debug", "--help"].includes(cmd) === false));
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
