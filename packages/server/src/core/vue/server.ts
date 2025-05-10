import express from 'express';
import { Command } from 'commander';
import { join } from 'node:path';
import detectPort from 'detect-port';

const program = new Command();
program.option('--cwd <cwd>', '当前工作目录');
program.option('--publicPath <publicPath>', 'publicPath');
program.option('--port [port]', '端口号');
program.parse(process.argv);
const app = express();

const options = program.opts();
(async () => {
    const port = await detectPort(options.port || 7001);
    app.use(options.publicPath, express.static(join(options.cwd, 'dist')));
    app.listen(port, () => {
        process.send?.({
            port,
        });
    });
})();
