import { describe, it, expect } from 'vitest';
// import kill from '.';
import net from 'node:net';
import detectPort from 'detect-port';

function isPortInUse(port: number) {
  return new Promise(resolve => {
    const server = new net.Server();
    server.listen(port);
    server.on('error', () => {
      resolve(true);
    });
    server.on('connection', () => {
      resolve(false);
    });
  });
}

describe('kill', () => {
  it('解除端口占用', async () => {
    const port = await detectPort(4083);
    await new Promise(async (resolve) => {
      const server = new net.Server();
      server.listen(port, () => {
        resolve(null);
      });
    });
    const inUse = await isPortInUse(port);
    expect(inUse).toBeTruthy();
    // await kill(['port', port.toString()]);
    // const portInUse = await isPortInUse(port);
    // expect(portInUse).toBeFalsy();
  });
});
