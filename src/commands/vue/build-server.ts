import express from 'express';
import getPort from 'detect-port';

(async () => {
  const app = express();
  const staticStr = process.argv
    .find((argv) => argv.startsWith('--static'))
    ?.replace('--static=', '');
  const statics = staticStr?.split(',');
  const rootStr = process.argv
    .find((argv) => argv.startsWith('--root'))
    ?.replace('--root=', '');
  const root = rootStr?.split(',');
  for (let i = 0; i < (statics as any[]).length; i++) {
    app.use(
      (root as any)[i] as string,
      express.static(`data/vue/${(statics as any[])[i]}`)
    );
  }
  const port = await getPort(8080);
  app.listen(port, () => {
    console.log(`项目已启动，端口号${port}`);
    process.send?.({
      port
    });
  });
})();
