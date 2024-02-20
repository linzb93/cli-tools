import { fork } from 'child_process';
import ipc from 'node-ipc';
import * as helper from '../helper.js';
type ConnectType = 'mysql' | 'schedule';

export const startService = (type: ConnectType) =>
  new Promise((resolve) => {
    const child = fork(`${type}.js`, {
      cwd: `${helper.root}/dist/util/service`
    });
    child.on('message', () => {
      resolve(null);
    });
  });
interface ResCallback {
  (data: any): void;
}

export function connectService(type: ConnectType): Promise<{
  send: (data: any) => void;
  listen: (callback: ResCallback) => void;
  disconnect(): void;
}> {
  return new Promise((resolve) => {
    let resCallback: ResCallback;
    ipc.config.silent = true;
    ipc.connectTo('schedule', () => {
      ipc.of.schedule.on('response', (data: any) => {
        typeof resCallback === 'function' && resCallback(data);
      });
      ipc.of.schedule.on('connect', () => {
        resolve({
          send(data) {
            ipc.of.schedule.emit('message', data);
          },
          listen(callback) {
            resCallback = callback;
          },
          disconnect() {
            ipc.disconnect('schedule');
          }
        });
      });
    });
  });
}
