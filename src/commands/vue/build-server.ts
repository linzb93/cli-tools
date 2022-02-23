import express from 'express';
import getPort from 'detect-port';

(async () => {
  const app = express();
  const statics = process.argv
    .find((argv) => argv.startsWith('--static'))
    ?.replace('--static=', '');
  const root = process.argv
    .find((argv) => argv.startsWith('--root'))
    ?.replace('--root=', '');
  app.use(root as string, express.static(statics as string));
  const port = await getPort(8080);
  app.listen(port, () => {
    console.log(`项目已启动，端口号${port}`);
    process.send?.({
      port
    });
  });
})();
