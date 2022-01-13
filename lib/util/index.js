const fs = require('fs-extra');
const path = require('path');
const { command: execa } = require('execa');
const logger = require('./logger');
const { pick } = require('lodash');
const npm = require('./npm');
const ValidatorSchema = require('async-validator');

exports.isURL = text => {
    return text.startsWith('http://') || text.startsWith('https://');
};

exports.isEmptyObject = value => {
    // eslint-disable-next-line no-unused-vars
    for (const key of value) {
        return false;
    }
    return true;
};

// 判断一个字符串是否是本地路径
exports.isPath = value => {
    return value.startsWith('/') || /[CDEFGHI]\:.+/.test(value) || value.startsWith('./') || value.startsWith('../');
};

async function openInEditor(project) {
    try {
        await execa(`code ${project}`);
    } catch (cmdError) {
        try {
            await fs.access(project);
        } catch (accessError) {
            logger.error('项目路径不存在');
            return;
        }
        logger.error('打开失败，未检测到有安装VSCode');
    }
}
exports.openInEditor = openInEditor;

exports.sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
});

exports.isWin = process.platform === 'win32';

exports.root = path.resolve(__dirname, '../../');

// 换行符
exports.eol = str => (str.includes('\r\n') ? '\r\n' : '\n');

// 在依赖未安装的时候，异步安装引入依赖
const requireDynamic = async moduleName => {
    try {
        return require(moduleName);
    } catch {
        await npm.install(moduleName);
        delete require.cache[path.resolve(process.cwd(), 'node_modules', moduleName)];
        return require(moduleName);
    }
};
exports.requireDynamic = requireDynamic;

// 获取快捷方式文件夹的真实地址（考虑windows快捷方式）
exports.getOriginPath = async rawPath => {
    if (this.isWin) {
        const ws = await requireDynamic('windows-shortcuts');
        return await new Promise(resolve => {
            ws.query(rawPath, (err, lnk) => {
                if (err) {
                    resolve(rawPath);
                } else {
                    resolve(lnk.target || rawPath);
                }
            });
        });
    }
    // await requireDynamic('macos-alias');
    return rawPath;
};

// 异步循环操作，直到满足条件退出。（不要删掉，目前还没用到，我不知道代码能放哪里）
exports.until = async function until(
    params, // 异步函数的参数
    pCallback, // 异步函数
    endCondition, // 结束循环条件
    changeParams // 不满足结束条件时参数发生的变化
) {
    let res;
    let cond = false;
    while (!cond) {
        res = await pCallback(params);
        cond = endCondition(res);
        params = changeParams(params);
    }
};

exports.processArgvToFlags = (options, isStr) => {
    const ret = Object.keys(options).map(opt => {
        if (options[opt] === true) {
            return `--${opt}`;
        }
        return `--${opt}=${options[opt]}`;
    });
    return isStr ? ret.join(' ') : ret;
};
exports.pickAndRename = (src, maps) => {
    const rawData = pick(src, Object.keys(maps));
    const data = {};
    for (const key in maps) {
        data[maps[key]] = rawData[key];
    }
    return data;
};
exports.validate = (obj, descriptor, options) => {
    const validator = new ValidatorSchema(descriptor);
    validator.validate(obj, (errors, fields) => {
        if (errors) {
            if (options.exitOnError) {
                process.exit(1);
            }
        }
    });
};
