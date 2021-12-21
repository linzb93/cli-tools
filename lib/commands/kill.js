
module.exports = async args => {
    if (args.length === 1) {
        // 只输入id。如果是4位数，先判断port，后判断pid；否则倒过来
    } else if (args.length === 2) {
        // mycli kill pid 24000
        // mycli kill port 8080
        // 对于1000以下的值要询问，可能会杀掉系统进程
    }
};
