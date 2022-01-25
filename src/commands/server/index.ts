import fs from 'fs-extra';
import notifier from 'node-notifier';
import dayjs from 'dayjs';
import { timejs, serverDB } from './util';
import path from 'path';
import BaseCommand from '../../util/BaseCommand';
const resolve = (src:string) => path.resolve(__dirname, src);

// 每日开启服务器
export default class extends BaseCommand {
    constructor() {
        super();
    }
    async run() {
        // 查找tasks文件夹里所有项目，添加至进程中。
        const tasksRoot = resolve('server/tasks');
        const tasks = await fs.readdir(tasksRoot);
        if (!tasks.length) {
            const arr = [];
            for (const task of tasks) {
                const stat = await fs.stat(task);
                arr.push({
                    filename: path.resolve(tasksRoot, task),
                    updateTime: stat.mtimeMs,
                    content: require(`./tasks/${task}`)
                });
            }
            // 如果当前时间大于等于任务时间，就执行任务
            arr.forEach(item => {
                if (!timejs(item.updateTime.toString()).isAfter(timejs())) {
                    item.content.action();
                    // TODO:不是没用了，是不想处理多参数的问题，先把代码都搬过来再说
                    // serverDB.set({
                    //     name: item.filename,
                    //     finished: true
                    // });
                    notifier.notify('请查看今日信息');
                } else {
                    // serverDB.set({
                    //     name: item.filename,
                    //     finished: false
                    // });
                }
            });
            // setInterval(async () => {
            //     // 任务做完后会标记当日已执行。这里检测任务时间逻辑和上面一样。
            //     for (const item of arr) {
            //         const stat = await fs.stat(item.filename);
            //         if (dayjs(item.updateTime).isBefore(stat.mtimeMs)) {
            //             // 启动服务器后文件有更新，需要重新引入
            //             delete require.cache[item.filename];
            //             item.content = require(item.filename);
            //             if (!timejs(item.time).isAfter(timejs())) {
            //                 item.content.action();
            //                 serverDB.set({
            //                     name: item.filename,
            //                     finished: true
            //                 });
            //                 notifier.notify('请查看今日信息');
            //             }
            //         } else if (!timejs(item.time).isAfter(timejs())) {
            //             item.content.action();
            //             serverDB.set({
            //                 name: item.filename,
            //                 finished: true
            //             });
            //             notifier.notify('请查看今日信息');
            //         }
            //     }
            // }, 1000 * 60 * 10);
        }
    };
    
}