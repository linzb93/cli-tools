const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const boxen = require('boxen');
const { command: execa } = require('execa');
const consola = require('consola');
const chalk = require('chalk');
const pMap = require('p-map');
const npm = require('./npm');
const readPkg = require('read-pkg');
const createCallsiteRecord = require('callsite-record');

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
            consola.error('项目路径不存在');
            return;
        }
        consola.error('打开失败，未检测到有安装VSCode');
    }
}
exports.openInEditor = openInEditor;

exports.sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
});

exports.isWin = process.platform === 'win32';

// 处理全局未捕捉的错误
exports.errorHandler = async (e, program, options = {}) => {
    console.log(boxen(`${chalk.bold.red('ERROR!')}\n${e.message}`, {
        align: 'center',
        borderColor: 'red',
        dimBorder: true,
        padding: 1,
        margin: 1,
        float: 'center'
    }));
    console.log(createCallsiteRecord({ forError: e }).renderSync());
    if ((program.args && program.args.includes('--debug')) || process.cwd() === path.resolve(__dirname, '../../')) {
        process.exit(0);
    }
    const ans = await inquirer.prompt([{
        type: 'confirm',
        message: `发现未处理的${options.async ? '异步' : ''}错误，是否打开编辑器修复bug？`,
        name: 'open'
    }]);
    if (ans.open) {
        openInEditor(path.resolve(__dirname, '../../'));
    }
};

// 在依赖未安装的时候，异步安装引入依赖
const requireDynamic = async moduleName => {
    try {
        return require(moduleName);
    } catch {
        await npm.install(moduleName);
        const modulePath = path.resolve(process.cwd(), 'node_modules', moduleName);
        const { main } = await readPkg({
            cwd: modulePath
        });
        return require(path.resolve(modulePath, main));
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
    await requireDynamic('macos-alias');
};

// 按顺序执行异步函数，返回第一个成功的结果
exports.pLocate = async (list, callback) => {
    for (let i = 0; i < list.length; i++) {
        try {
            return await callback(list[i]);
        } catch (error) {
            //
        }
    }
    throw new Error('err');
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

exports.sequenceExec = async commandList => {
    return await pMap(commandList, async command => {
        console.log(`${chalk.cyan('actions:')} ${chalk.yellow(command)}`);
        try {
            await execa(command, { stdio: 'inherit' });
        } catch (error) {
            throw error;
        }
    });
};
