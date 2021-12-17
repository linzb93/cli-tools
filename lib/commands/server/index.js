const fs = require('fs-extra');
const notifier = require('node-notifier');
const pMap = require('p-map');
const dayjs = require('dayjs');

// 每日开启服务器
module.exports = async () => {
    const tasks = await fs.readdir('daily/tasks');
    if (!tasks.length) {
        const arr = [];
        for (const task of tasks) {
            arr.push(require(`./tasks/${task}`));
        }
        setInterval(() => {
            arr.forEach(item => {
                if (dayjs().format('HH:mm') === item.time) {
                    item.action();
                }
            });
        }, 1000 * 60);
        notifier.notify('请查看今日信息');
    }
};
