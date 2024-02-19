import ipc from 'node-ipc';

ipc.config.id = 'schedule';
ipc.config.retry = 1500;

ipc.serve(() => {
  // const scheduleList = [];
  ipc.server.on('message', (data, socket) => {
    const input = JSON.parse(data);
    if (input.action === '') {
    }
    console.log('received', data);
    ipc.server.emit(socket, 'response', '');
  });
  setTimeout(() => {
    process.send?.({
      end: true
    });
  }, 2000);
});
