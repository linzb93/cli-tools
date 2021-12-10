const ora = require('ora');
const isWin = process.platform === 'win32';

const defaults = {
    timeWarning: 5000,
    timeout: 7000,
    exitText: '运行超时，进程已自动退出'
};
let options = { ...defaults };
const rawSpinner = ora({
    interval: isWin ? 1000 : 100
});
let counter = 0; // 计时器数字
let timer = null; // 计时器
let outerText = '';
const spinner = new Proxy(rawSpinner, {
    get(target, propKey, receiver) {
        if (propKey === 'start') {
            timer = setInterval(() => {
                counter++;
                if (counter > options.timeWarning / 1000 && counter <= options.timeout / 1000) {
                    rawSpinner.text = outerText + counter;
                } else if (counter > options.timeout / 1000) {
                    spinner.fail(options.exitText);
                    process.exit(1);
                }
            }, 1000);
        } else if (propKey === 'succeed' || propKey === 'fail') {
            clearInterval(timer);
        }
        return Reflect.get(target, propKey, receiver);
    },
    set(target, propKey, value, receiver) {
        if (propKey === 'text') {
            if (outerText === '') {
                spinner.start();
            }
            outerText = value;
        }
        return Reflect.set(target, propKey, value, receiver);
    }
});
spinner.set = (opt = {}) => {
    options = { ...defaults, ...opt };
};

module.exports = spinner;
