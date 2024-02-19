import ipc from 'node-ipc';
import dayjs from 'dayjs';
import { omit } from 'lodash';
import { v4 as uuid } from 'uuid';
ipc.config.id = 'schedule';
ipc.config.retry = 1500;

ipc.serve(() => {
  let scheduleList: any[];
  ipc.server.on('message', (data, socket) => {
    if (data.action) {
      scheduleList.push({
        ...data,
        id: uuid(),
        socket
      });
    }
  });
  const todayFormat = dayjs().format('YYYY-MM-DD');
  const timer = setInterval(() => {
    if (!scheduleList.length) {
      clearInterval(timer);
      return;
    }
    const dueTask = scheduleList.find((item) =>
      dayjs().isAfter(`${todayFormat} ${item.executeTime}:00`)
    );
    if (dueTask) {
      ipc.server.emit(
        dueTask.socket,
        'response',
        omit(dueTask, ['id', 'socket'])
      );
      scheduleList = scheduleList.filter((item) => item.id !== dueTask.id);
    }
  }, 1000 * 60);
  setTimeout(() => {
    process.send?.({
      end: true
    });
  }, 2000);
});
ipc.server.start();
