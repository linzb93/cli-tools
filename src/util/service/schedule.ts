import { createServer } from 'net';
import detectPort from 'detect-port';
import dayjs from 'dayjs';
import lodash from 'lodash';
import { v4 as uuid } from 'uuid';
const { omit } = lodash;
(async () => {
  const server = createServer((socket) => {
    let scheduleList: any[] = [];
    const todayFormat = dayjs().format('YYYY-MM-DD');
    socket.on('data', (data: any) => {
      const obj = JSON.parse(data);
      if (obj.action) {
        if (obj.interval) {
          const timeUnit = obj.interval.at(-1);
          const delta = Number(obj.interval.slice(0, -1));
          scheduleList.push({
            ...obj,
            id: uuid(),
            intervalSeg: [delta, timeUnit],
            executeTime: dayjs().add(delta, timeUnit).format('HH:mm')
          });
        } else {
          scheduleList.push({
            ...obj,
            id: uuid()
          });
        }
      }
    });
    setInterval(() => {
      const dueTask = scheduleList.find((item) =>
        dayjs().isAfter(`${todayFormat} ${item.executeTime}:00`)
      );
      if (dueTask) {
        socket.write(
          JSON.stringify({
            ...omit(dueTask, ['id'])
          })
        );
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
  const port = await detectPort(6061);
  server.listen(port, () => {
    console.log('定时器进程已启动！');
    process.send?.({
      port
    });
  });
})();
