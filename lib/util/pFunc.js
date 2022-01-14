const pMap = require('p-map');
const { command: execa } = require('execa');
const chalk = require('chalk');

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

exports.pRetry = async (input, {
    retries = 10,
    retryTimesCallback
}) => {
    let c = 0;
    const retryFunc = async (ipt, retriesTime) => {
        try {
            return await ipt();
        } catch (error) {
            c++;
            typeof retryTimesCallback === 'function' && retryTimesCallback(c);
            if (c === retriesTime) {
                throw error;
            } else {
                return retryFunc(ipt, retriesTime);
            }
        }
    };
    let data;
    try {
        data = await retryFunc(input, retries);
    } catch (error) {
        throw error;
    }
    return data;
};

exports.sequenceExec = async commandList => {
    for (const commandItem of commandList) {
        const command = typeof commandItem === 'string' ? commandItem : commandItem.message;
        if (!command) {
            return;
        }
        console.log(`${chalk.cyan('actions:')} ${chalk.yellow(command)}`);
        try {
            const { stdout } = await execa(command);
            if (stdout) {
                console.log(stdout);
            }
        } catch (error) {
            if (typeof commandItem.onError === 'function') {
                try {
                    await commandItem.onError(error.message);
                } catch {
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }
};
