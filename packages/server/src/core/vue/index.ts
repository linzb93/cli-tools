import BaseCommand from '../BaseCommand';
import { showOpenDialog } from '@/utils/dialog';
import { execaCommand as execa } from 'execa';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import internalIp from 'internal-ip';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork } from 'node:child_process';
import fs from 'fs-extra';
import sql, { Database } from '@/utils/sql';
import * as git from '@/core/git/utils';
import { objectToCmdOptions } from '@/utils/helper';
export interface Options {
    command: string;
    /**
     * 是否显示已操作过的任务列表
     * @default false
     */
    list: boolean;
    /**
     * 是否只开启服务，不打包
     * @default false
     */
    server: boolean;
    /**
     * 是否切换分支，并打包
     * @default false
     */
    checkoutAndBuild: boolean;
    /**
     * 是否是本地项目
     * @default false
     */
    current: boolean;
    /**
     * 端口号
     * @default 7001
     */
    port: number;
    publicPath: string;
}

export default class Vue extends BaseCommand {
    async main(options: Options) {
        if (options.checkoutAndBuild) {
            await this.checkoutBranchAndBuild();
            return;
        }
        let cwd = '';
        let command = '';
        let port = options.port;
        let publicPath = options.publicPath;
        if (options.list) {
            const list = (await sql((db) => db.vue)) as (Database['vue'][number] & { branchName: string })[];
            for (const item of list) {
                item.branchName = await git.getCurrentBranchName(item.path);
            }
            const { selectedId } = await this.inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedId',
                    message: '请选择运行的项目及命令',
                    choices: list.map((item) => ({
                        name: `${chalk.yellow(item.name)}(${chalk.blue(item.path)}) 命令: ${chalk.green(
                            item.command
                        )} 分支: ${chalk.blue(item.branchName)}`,
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
            port = match.defaultPort;
            publicPath = match.publicPath;
        } else if (options.current) {
            command = options.command || 'build';
            cwd = process.cwd();
        } else {
            cwd = await showOpenDialog('directory');
            if (!cwd) {
                this.logger.error('请选择项目路径');
                return;
            }
            command = options.command || 'build';
        }
        this.logger.backwardConsole();
        if (options.server) {
            this.spinner.text = '正在启动服务器';
        } else {
            const branchName = await git.getCurrentBranchName(cwd);
            this.spinner.text = `正在项目${chalk.yellow(cwd)}(${chalk.blue(
                `${branchName}分支`
            )})执行命令：${chalk.green(`npm run ${command}`)}，请稍后...`;
            await execa(`npm run ${command}`, { cwd });
        }
        const confFileContent = await fs.readFile(join(cwd, 'vue.config.js'), 'utf-8');

        if (!publicPath) {
            const contentSeg = confFileContent.split('\n');
            const matchLine = contentSeg.find((line) => line.includes('publicPath:'));
            if (!matchLine) {
                this.logger.error('vue.config.js not found');
                return;
            }
            publicPath = matchLine.split(/: ?/)[1].trim().slice(1, -2);
        }
        if (!options.list) {
            await sql((db) => {
                db.vue.push({
                    id: db.vue.length + 1,
                    path: cwd,
                    command,
                    name: basename(cwd),
                    publicPath,
                    defaultPort: options.port,
                });
            });
        }
        const child = fork(
            resolve(fileURLToPath(import.meta.url), '../vueServer.js'),
            objectToCmdOptions({
                cwd,
                publicPath,
                port,
            }),
            {
                detached: true,
                stdio: [null, null, null, 'ipc'],
            }
        );
        child.on('message', async (message: any) => {
            const ip = await internalIp.v4();
            const url = `http://${ip}:${message.port}${publicPath}`;
            this.spinner.succeed(`服务已启动\n${chalk.magenta(url)}`);
            clipboardy.writeSync(url);
            child.unref();
            child.disconnect();
            process.exit(0);
        });
    }
    /**
     * 切换分支，并打包
     */
    private async checkoutBranchAndBuild() {
        const list = await sql((db) => db.vue);
        const pathList = Array.from(new Set(list.map((item) => item.path)));
        const { selectedPath } = await this.inquirer.prompt([
            {
                type: 'list',
                name: 'selectedPath',
                message: '请选择项目',
                choices: pathList.map((path) => ({
                    name: path,
                    value: path,
                })),
            },
        ]);
        const branchs = await git.getAllBranches(selectedPath);
        const { selectedBranch } = await this.inquirer.prompt([
            {
                type: 'list',
                name: 'selectedBranch',
                message: '请选择分支',
                choices: branchs.map((branch) => ({
                    name: branch.name,
                    value: branch.name,
                })),
            },
        ]);
        await execa(`git checkout ${selectedBranch}`, { cwd: selectedPath });
        this.spinner.text = '正在打包';
        await execa(`npm run build`, { cwd: selectedPath });
        this.spinner.succeed('打包成功');
    }
}
