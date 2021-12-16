const fs = require('fs-extra');
const notifier = require('node-notifier');
const pMap = require('p-map');

// 每日开启服务器
module.exports = async () => {
    const tasks = await fs.readdir('daily/tasks');
    if (!tasks.length) {
        // pMap(tasks, async task => {
        //     require(`./tasks/${task}`);
        // });
        notifier.notify('请查看今日信息');
    }
};
