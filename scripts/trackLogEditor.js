#!/usr/bin/env node
/**
 * cache/track 日志文件编辑器
 * 用于编辑和删除命令行使用日志
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRACK_DIR = path.join(__dirname, '..', 'cache', 'track');

// 获取所有日志文件
function getLogFiles() {
    if (!fs.existsSync(TRACK_DIR)) {
        console.error('目录不存在:', TRACK_DIR);
        return [];
    }
    return fs
        .readdirSync(TRACK_DIR)
        .filter((f) => f.endsWith('.log'))
        .sort();
}

// 读取日志内容
function readLog(filename) {
    const filepath = path.join(TRACK_DIR, filename);
    return fs.readFileSync(filepath, 'utf-8');
}

// 写入日志内容
function writeLog(filename, content) {
    const filepath = path.join(TRACK_DIR, filename);
    fs.writeFileSync(filepath, content, 'utf-8');
}

// 删除日志文件
function deleteLog(filename) {
    const filepath = path.join(TRACK_DIR, filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('已删除:', filename);
    } else {
        console.error('文件不存在:', filename);
    }
}

// 删除命令记录（如删除所有 "ai ocr" 的日志行）
// 返回 { content, count } 其中 count 是删除的记录条数
function removeCommand(content, cmd) {
    const escapedCmd = cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\] ${escapedCmd}([ \n]|$)`, 'g');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    const newContent = content.replace(regex, '');
    return { content: newContent, count };
}

// 替换命令（支持重命名，如 "git pull" -> "git fetch"）
// 返回 { content, count } 其中 count 是修改的记录条数
function replace(content, oldCmd, newCmd) {
    // oldCmd 后面可能是空格或换行符
    const escapedCmd = oldCmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\] )${escapedCmd}([ \n]|$)`, 'g');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    const newContent = content.replace(regex, `$1${newCmd}$2`);
    return { content: newContent, count };
}

// 显示使用帮助
function showHelp() {
    console.log(`
用法: node trackLogEditor.js <命令> [参数]

命令:
  list                              列出所有日志文件
  cat <文件名>                       查看日志内容
  edit <旧命令> <新命令>              替换命令
  del <命令>                         删除命令记录
  rm                                删除所有日志文件 (需确认)

示例:
  node trackLogEditor.js list
  node trackLogEditor.js cat 2026Q2.log
  node trackLogEditor.js edit "ai ocr" "ocr"           # 替换
  node trackLogEditor.js edit "iteration" "git iteration"
  node trackLogEditor.js del "ai ocr"                 # 删除记录
  node trackLogEditor.js rm
`);
}

// 主逻辑
const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === 'help') {
    showHelp();
    process.exit(0);
}

switch (cmd) {
    case 'list': {
        const files = getLogFiles();
        console.log('日志文件列表:');
        files.forEach((f) => console.log('  -', f));
        break;
    }

    case 'cat': {
        const filename = args[1];
        if (!filename) {
            console.error('请指定文件名');
            process.exit(1);
        }
        console.log(readLog(filename));
        break;
    }

    case 'edit': {
        const oldCmd = args[1];
        const newCmd = args[2];

        if (!oldCmd || !newCmd) {
            console.error('请提供两个参数: <旧命令> <新命令>');
            process.exit(1);
        }

        const files = getLogFiles();
        let totalCount = 0;

        for (const filename of files) {
            const content = readLog(filename);
            const result = replace(content, oldCmd, newCmd);

            if (result.count > 0) {
                writeLog(filename, result.content);
                totalCount += result.count;
            }
        }

        if (totalCount === 0) {
            console.log(`未找到 "${oldCmd}"`);
        } else {
            console.log(`替换 "${oldCmd}" -> "${newCmd}"，共 ${totalCount} 条`);
        }
        break;
    }

    case 'del': {
        const cmd = args[1];

        if (!cmd) {
            console.error('请提供要删除的命令');
            process.exit(1);
        }

        const files = getLogFiles();
        let totalCount = 0;

        for (const filename of files) {
            const content = readLog(filename);
            const result = removeCommand(content, cmd);

            if (result.count > 0) {
                writeLog(filename, result.content);
                totalCount += result.count;
            }
        }

        if (totalCount === 0) {
            console.log(`未找到 "${cmd}"`);
        } else {
            console.log(`删除 "${cmd}"，共 ${totalCount} 条`);
        }
        break;
    }

    case 'rm': {
        const files = getLogFiles();
        console.log('将删除以下文件:');
        files.forEach((f) => console.log('  -', f));
        console.log('\n确认删除? (y/N)');
        let input = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => {
            input += chunk;
        });
        process.stdin.on('end', () => {
            if (input.trim().toLowerCase() === 'y') {
                files.forEach((f) => deleteLog(f));
                console.log('已删除所有日志文件');
            } else {
                console.log('已取消');
            }
        });
        break;
    }

    default:
        console.error('未知命令:', cmd);
        showHelp();
        process.exit(1);
}
