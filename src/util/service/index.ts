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
}> {
  return new Promise((resolve) => {
    let resCallback: ResCallback;
    ipc.connectTo('shedule', () => {
      ipc.of.schedule.on('connect', () => {
        ipc.of.schedule.on('response', resCallback);
        resolve({
          send(data) {
            ipc.of.schedule.emit('message', data);
          },
          listen(callback) {
            resCallback = callback;
          }
        });
      });
    });
  });
}
