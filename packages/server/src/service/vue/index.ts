import BaseCommand from '@/common/BaseCommand';
import { showOpenDialog } from '@/common/dialog';
import { execaCommand as execa } from 'execa';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import internalIp from 'internal-ip';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork } from 'node:child_process';
import fs from 'fs-extra';
import sql from '@/common/sql';
export interface Options {
    command: string;
    list: boolean;
}

export default class Vue extends BaseCommand {
    async main(options: Options) {
        let cwd = '';
        let command = '';
        if (options.list) {
            const list = await sql((db) => db.vue);
            const { selectedId } = await this.inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedId',
                    message: '请选择运行的项目及命令',
                    choices: list.map((item) => ({
                        name: `${chalk.yellow(item.name)}(${chalk.blue(item.path)}) 命令: ${chalk.green(item.command)}`,
                        value: item.id,
                    })),
                },
            ]);
            const match = list.find((item) => item.id === selectedId);
            if (!match) {
                return;
            }
            cwd = match.path;
            command = match.command;
        } else {
            cwd = await showOpenDialog('directory');
            if (!cwd) {
                return;
            }
            command = options.command || 'build';
            await sql((db) => {
                db.vue.push({
                    id: db.vue.length + 1,
                    path: cwd,
                    command,
                    name: basename(cwd),
                });
            });
        }
        this.logger.backwardConsole();
        this.spinner.text = `正在项目${chalk.yellow(cwd)}执行命令：${chalk.green(`npm run ${command}`)}，请稍后...`;
        await execa(`npm run ${command}`, { cwd });
        const confFileContent = await fs.readFile(join(cwd, 'vue.config.js'), 'utf-8');
        const contentSeg = confFileContent.split('\n');
        const matchLine = contentSeg.find((line) => line.includes('publicPath:'));
        if (!matchLine) {
            this.logger.error('vue.config.js not found');
            return;
        }
        const publicPath = matchLine.split(/: ?/)[1].trim().slice(1, -2);
        const child = fork(
            resolve(fileURLToPath(import.meta.url), '../vueServer.js'),
            [`--cwd=${cwd}`, `--publicPath=${publicPath}`],
            {
                detached: true,
                stdio: [null, null, null, 'ipc'],
            }
        );
        child.on('message', async (message: any) => {
            const ip = await internalIp.v4();
            const url = `http:${ip}:${message.port}${publicPath}`;
            this.spinner.succeed(`服务已启动：${chalk.magenta(url)}`);
            clipboardy.writeSync(url);
            child.unref();
            child.disconnect();
            process.exit(0);
        });
        // const app = express();
        // app.use(express.static(join(cwd, 'dist')));
        // app.listen(3000, () => {
        //     console.log('Server is running on port 3000');
        // })
        // const child = fork('', {
        //       cwd,
        //       detached: true,
        //       stdio: [null, null, null, "ipc"],
        //     });
    }
}
