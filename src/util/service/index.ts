import { fork } from 'child_process';
import ipc from 'node-ipc';
type ConnectType = 'mysql' | 'schedule';

ipc.config.id = 'client';
ipc.config.retry = 1500;

interface ResponseFunction {
  (data: any): void;
}

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
  let connected = false;
  let responseCallback: ResponseFunction;
  ipc.connectTo('server', () => {
    ipc.of.server.on('connect', () => {
      connected = true;
    });
    ipc.of.server.on('response', (message) => {
      responseCallback(message);
    });
  });
  return {
    send(obj: any) {
      if (connected) {
        ipc.of.server.emit('message', obj);
      }
    },
    onResponse(callback: ResponseFunction) {
      responseCallback = callback;
    }
  };
}
