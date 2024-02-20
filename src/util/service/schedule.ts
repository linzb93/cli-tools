import ipc from 'node-ipc';
import dayjs from 'dayjs';
import chalk from 'chalk';
import lodash from 'lodash';
import { v4 as uuid } from 'uuid';
const { omit } = lodash;
(async () => {
  ipc.config.id = 'schedule';
  ipc.config.retry = 1500;
  ipc.config.silent = true;

  ipc.serve(() => {
    let scheduleList: any[] = []; // 存放所有定时任务
    const todayFormat = dayjs().format('YYYY-MM-DD');

    ipc.server.on('message', (obj, socket) => {
      if (!obj.action) {
        return;
      }
      if (obj.interval) {
        // 轮询任务，每次执行后生成下次执行的时间
        const timeUnit = obj.interval.slice(-1);
        const delta = Number(obj.interval.slice(0, -1));
        scheduleList.push({
          ...obj,
          id: uuid(),
          intervalSeg: [delta, timeUnit],
          socket,
          executeTime: dayjs().add(delta, timeUnit).format('HH:mm')
        });
      } else if (dayjs().isBefore(`${todayFormat} ${obj.executeTime}:00`)) {
        scheduleList.push({
          ...obj,
          id: uuid(),
          socket
        });
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
          ipc.connectTo('mainService', () => {
            ipc.of.mainService.on('connect', () => {
              ipc.of.mainService.emit('message', output);
              ipc.disconnect('mainService');
            });
          });
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
