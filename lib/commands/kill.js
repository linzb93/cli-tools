const consola = require('consola');
const inquirer = require('inquirer');
const numberRE = /[1-9][0-9]*/;
module.exports = async args => {
    if (args.length === 1) {
        // 只输入id。如果是4位数，先判断port，后判断pid；否则倒过来
        if (!numberRE.test(args[0])) {
            consola.error('端口号或者进程ID格式不正确，只能输入数字');
            return;
        }
        const id = Number(args[0]);
        if (id < 1000 && await confirm()) {
            await killPort(id);
            consola.error('关闭成功');
        }
    } else if (args.length === 2) {
        // mycli kill pid 24000
        // mycli kill port 8080
        // 对于1000以下的值要询问，可能会杀掉系统进程
        const [ target, idStr ] = args;
        let id;
        if (target === 'port') {
            if (!numberRE.test(idStr)) {
                consola.error('端口号格式不正确，只能输入数字');
                return;
            }
            id = Number(idStr);
        } else if (target === 'pid') {
            if (!numberRE.test(idStr)) {
                consola.error('进程ID格式不正确，只能输入数字');
                return;
            }
            id = Number(idStr);
        } else {
            consola.error('命令不正确，请输入进程ID: pid，或者端口号: port');
        }
    }
};

async function confirm() {
    const ans = await inquirer.prompt([{
        type: 'confirm',
        message: '您可能要关闭系统进程，确认是否继续？',
        name: 'data'
    }]);
    return ans.data;
}

async function killPort(port) {}
async function killProcess(pid) {}
