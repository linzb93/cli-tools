import express from 'express';
import getPort from 'detect-port';
import internalIp from 'internal-ip';

(async () => {
  const app = express();
  const statics = process.argv
    .find((argv) => argv.startsWith('--static'))
    ?.replace('--static=', '');
  app.use(express.static(statics as string));
  const [port, ip] = await Promise.all([getPort(8080), internalIp.v4()]);
  process.send?.({
    url: `http://${ip}:${port}`
  });
})();
