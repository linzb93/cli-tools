const git = require('../../util/git');
const npm = require('../../util/npm');
const ora = require('ora');
const { pRetry } = require('../../util/pFunc');

module.exports = async () => {
    const spinner = ora('开始拉取代码').start();
    try {
        await pRetry(() => git.pull(), {
            retries: 10,
            retryTimesCallback: times => {
                spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
            }
        });
    } catch (error) {
        spinner.fail('网络问题，请稍后再试');
        return;
    }
    spinner.text = '拉取成功，正在安装依赖';
    try {
        await npm.install();
    } catch (error) {
        spinner.fail(`依赖安装失败：\n ${error.message}`);
    }
    spinner.succeed('依赖安装完成，代码同步成功');
};
