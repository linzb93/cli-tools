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
     * 是否切换分支，打包并启动服务器
     * @default false
     */
    checkout: boolean;
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
        if (options.checkout) {
            await this.checkoutBranchAndStartServer(options);
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

        await this.startServer(cwd, publicPath, port);
    }
    /**
     * 选择项目和分支
     * @returns 选中的项目路径和分支名称
     */
    private async selectProjectAndBranch(): Promise<{ selectedPath: string; selectedBranch: string }> {
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

        const branches = await git.getAllBranches(selectedPath);

        const { selectedBranch } = await this.inquirer.prompt([
            {
                type: 'list',
                name: 'selectedBranch',
                message: '请选择分支',
                choices: branches.map((branch) => ({
                    name: branch.name,
                    value: branch.name,
                })),
            },
        ]);

        return { selectedPath, selectedBranch };
    }

    /**
     * 切换分支，打包并启动服务器
     * @param options 命令选项
     */
    private async checkoutBranchAndStartServer(options: Options) {
        // 1. 选择项目和分支
        const { selectedPath, selectedBranch } = await this.selectProjectAndBranch();

        // 2. 切换分支
        this.spinner.text = `正在切换到分支: ${chalk.blue(selectedBranch)}`;
        await execa(`git checkout ${selectedBranch}`, { cwd: selectedPath });

        // 3. 获取项目的命令和配置
        const list = await sql((db) => db.vue);
        const project = list.find((item) => item.path === selectedPath);
        if (!project) {
            this.logger.error('找不到项目配置');
            return;
        }

        const command = project.command || 'build';
        let port = options.port || project.defaultPort;
        let publicPath = options.publicPath || project.publicPath;

        // 4. 打包项目
        this.spinner.text = `正在项目${chalk.yellow(selectedPath)}(${chalk.blue(
            `${selectedBranch}分支`
        )})执行命令：${chalk.green(`npm run ${command}`)}，请稍后...`;
        await execa(`npm run ${command}`, { cwd: selectedPath });

        // 5. 读取配置文件
        if (!publicPath) {
            const confFileContent = await fs.readFile(join(selectedPath, 'vue.config.js'), 'utf-8');
            const contentSeg = confFileContent.split('\n');
            const matchLine = contentSeg.find((line) => line.includes('publicPath:'));
            if (!matchLine) {
                this.logger.error('vue.config.js not found');
                return;
            }
            publicPath = matchLine.split(/: ?/)[1].trim().slice(1, -2);
        }

        // 6. 启动服务器
        await this.startServer(selectedPath, publicPath, port);
    }

    /**
     * 启动服务器
     * @param cwd 项目路径
     * @param publicPath 公共路径
     * @param port 端口号
     */
    private async startServer(cwd: string, publicPath: string, port: number): Promise<void> {
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

        return new Promise((resolve) => {
            child.on('message', async (message: any) => {
                const ip = await internalIp.v4();
                const url = `http://${ip}:${message.port}${publicPath}`;
                this.spinner.succeed(`服务已启动\n${chalk.magenta(url)}`);
                clipboardy.writeSync(url);
                child.unref();
                child.disconnect();
                resolve();
                process.exit(0);
            });
        });
    }
}
