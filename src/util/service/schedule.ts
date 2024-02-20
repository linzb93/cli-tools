import ipc from 'node-ipc';
import dayjs from 'dayjs';
import chalk from 'chalk';
import lodash from 'lodash';
import { v4 as uuid } from 'uuid';
const { omit } = lodash;
(async () => {
  ipc.config.id = 'schedule';
  ipc.config.retry = 1500;
  ipc.serve(() => {
    let scheduleList: any[] = [];
    const todayFormat = dayjs().format('YYYY-MM-DD');
    ipc.server.on('message', (obj, socket) => {
      if (obj.action) {
        if (obj.interval) {
          const timeUnit = obj.interval.slice(-1);
          const delta = Number(obj.interval.slice(0, -1));
          scheduleList.push({
            ...obj,
            id: uuid(),
            intervalSeg: [delta, timeUnit],
            socket,
            executeTime: dayjs().add(delta, timeUnit).format('HH:mm')
          });
          console.log(`收到定时任务：${JSON.stringify(obj)}`);
        } else if (dayjs().isBefore(`${todayFormat} ${obj.executeTime}:00`)) {
          console.log(`收到定时任务：${JSON.stringify(obj)}`);
          scheduleList.push({
            ...obj,
            id: uuid(),
            socket
          });
        }
      }
    });
    setInterval(() => {
      const dueTask = scheduleList.find((item) =>
        dayjs().isAfter(`${todayFormat} ${item.executeTime}:00`)
      );
      if (dueTask) {
        const output = {
          ...omit(dueTask, ['id', 'socket'])
        };
        if (!dueTask.sendToMainService) {
          dueTask.socket.write(output);
        } else {
          // emitter.emit('message', output);
        }
        if (dueTask.times) {
          dueTask.times -= 1;
        }
        if (dueTask.interval) {
          dueTask.executeTime = dayjs()
            .add(dueTask.intervalSeg[0], dueTask.intervalSeg[1])
            .format('HH:mm');
          if (dueTask.times > 0 || dueTask.times === undefined) {
            return;
          }
        }
        scheduleList = scheduleList.filter((item) => item.id !== dueTask.id);
      }
    }, 1000 * 10);
  });
  ipc.server.start();
  console.log(`${chalk.gray(dayjs().format('HH:mm:ss'))} 定时器进程已启动！`);
  process.send?.({});
})();
