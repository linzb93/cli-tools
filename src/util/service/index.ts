import { fork } from 'child_process';

type ConnectType = 'mysql' | 'schedule';

export default function createConnection(type: ConnectType) {
  const child = fork(`./${type}.js`, {
    detached: true,
    stdio: [null, null, null, 'ipc'],
    cwd: process.cwd()
  });
  child.on('message', (message: any) => {
    if (message.end) {
      child.unref();
      child.disconnect();
    }
  });
}
