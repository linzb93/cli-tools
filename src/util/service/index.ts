import { fork } from 'child_process';
import { createConnection } from 'net';
import chalk from 'chalk';
import * as helper from '../helper.js';
import ls from '../ls.js';
type ConnectType = 'mysql' | 'schedule';

export const startService = (type: ConnectType) =>
  new Promise((resolve) => {
    const child = fork(`${type}.js`, {
      cwd: `${helper.root}/dist/util/service`
    });
    child.on('message', (obj: { port: number }) => {
      ls.set(`service.port.${type}`, obj.port);
      resolve(null);
    });
  });

export const connectService = (type: ConnectType) => {
  const client = createConnection({ port: ls.get(`service.port.${type}`) });
  client.on('error', (error) => {
    console.log(chalk.red(`${type}服务连接失败：${error.message}`));
    process.exit(1);
  });
  return client;
};
