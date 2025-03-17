import express from 'express';
import { Command } from 'commander';
import { join } from 'node:path';

const program = new Command();
program.parse(process.argv);
program.option('--command, <command>, 执行的命令');
const app = express();
app.use(express.static(join(program.opts().command, 'dist')));
app.listen(7001, () => {
    console.log('Server is running on port 7001');
    process.send?.({
        port: 7001,
        command: program.opts().command,
    });
});
