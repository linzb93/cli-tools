
const { sleep } = require('./lib/util');
module.exports = async () => {
    const spinner = require('./lib/spinner');
    console.log('进入程序');
    spinner.text = '开始';
    await sleep(2000);
    spinner.stopAndPersist();
    await sleep(1000);
    spinner.text = '中场时间';
    await sleep(16000);
    spinner.succeed('成功完成');
};
