import BaseManager from '../BaseManager';
import { showOpenDialog } from '../../utils/dialog';
import { execaCommand as execa } from 'execa';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import internalIp from 'internal-ip';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork } from 'node:child_process';
import fs from 'fs-extra';
import { Database } from '../../utils/sql';
import * as git from '../git/utils';
import { objectToCmdOptions, isOldNode } from '../../utils/helper';
import globalConfig from '../../../../../config.json';
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

/**
 * 项目配置信息
 */
interface ProjectConfig {
    cwd: string;
    command: string;
    port: number;
    publicPath: string;
    branchName?: string;
}

export class VueManager extends BaseManager {
    /**
     * 命令主入口
     * @param options 命令选项
     */
    async main(options: Options) {
        if (!isOldNode) {
            this.logger.error('请使用node14版本');
            return;
        }
        if (options.checkout) {
            await this.checkoutBranchAndStartServer(options);
            return;
        }

        // 获取项目配置
        const projectConfig = await this.getProjectConfig(options);
        if (!projectConfig) {
            return;
        }

        // 执行构建命令
        if (!options.server) {
            await this.buildProject(projectConfig);
        }

        // 保存项目信息到数据库
        if (!options.list) {
            await this.saveProjectToDatabase(projectConfig);
        }

        // 启动服务器
        await this.startServer(projectConfig.cwd, projectConfig.publicPath, projectConfig.port);
    }

    /**
     * 获取项目配置信息
     * @param options 命令选项
     * @returns 项目配置信息
     */
    private async getProjectConfig(options: Options): Promise<ProjectConfig | null> {
        if (options.list) {
            return await this.getProjectConfigFromList();
        } else if (options.current) {
            return this.getProjectConfigFromCurrent(options);
        } else {
            return await this.getProjectConfigFromDialog(options);
        }
    }

    /**
     * 从列表中获取项目配置
     * @returns 项目配置信息
     */
    private async getProjectConfigFromList(): Promise<ProjectConfig | null> {
        const list = (await this.sql((db) => db.vue)) as (Database['vue'][number] & { branchName: string })[];

        // 获取每个项目的当前分支
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
            return null;
        }

        return {
            cwd: match.path,
            command: match.command,
            port: match.defaultPort,
            publicPath: match.publicPath,
            branchName: match.branchName,
        };
    }

    /**
     * 从当前目录获取项目配置
     * @param options 命令选项
     * @returns 项目配置信息
     */
    private getProjectConfigFromCurrent(options: Options): ProjectConfig {
        return {
            cwd: process.cwd(),
            command: options.command || 'build',
            port: options.port,
            publicPath: options.publicPath,
        };
    }

    /**
     * 从对话框选择获取项目配置
     * @param options 命令选项
     * @returns 项目配置信息
     */
    private async getProjectConfigFromDialog(options: Options): Promise<ProjectConfig | null> {
        const cwd = await showOpenDialog('directory');
        if (!cwd) {
            this.logger.error('请选择项目路径');
            return null;
        }

        return {
            cwd,
            command: options.command || 'build',
            port: options.port,
            publicPath: options.publicPath,
        };
    }

    /**
     * 构建项目
     * @param config 项目配置
     */
    private async buildProject(config: ProjectConfig): Promise<void> {
        this.logger.backwardConsole();

        // 获取当前分支
        const branchName = config.branchName || (await git.getCurrentBranchName(config.cwd));

        this.spinner.text = `正在项目${chalk.yellow(config.cwd)}(${chalk.blue(
            `${branchName}分支`
        )})执行命令：${chalk.green(`npm run ${config.command}`)}，请稍后...`;

        await execa(`npm run ${config.command}`, { cwd: config.cwd });
    }

    /**
     * 从配置文件获取 publicPath
     * @param cwd 项目路径
     * @returns publicPath 值
     */
    private async getPublicPathFromConfig(cwd: string): Promise<string | undefined> {
        try {
            const confFileContent = await fs.readFile(join(cwd, 'vue.config.js'), 'utf-8');
            const contentSeg = confFileContent.split('\n');
            const matchLine = contentSeg.find((line) => line.includes('publicPath:'));

            if (matchLine) {
                return matchLine.split(/: ?/)[1].trim().slice(1, -2);
            }
        } catch (error) {
            this.logger.error(`读取 vue.config.js 失败: ${error}`);
        }

        return undefined;
    }

    /**
     * 保存项目信息到数据库
     * @param config 项目配置
     */
    private async saveProjectToDatabase(config: ProjectConfig): Promise<void> {
        if (!config.publicPath) {
            config.publicPath = (await this.getPublicPathFromConfig(config.cwd)) || '';
        }

        await this.sql((db) => {
            db.vue.push({
                id: db.vue.length + 1,
                path: config.cwd,
                command: config.command,
                name: basename(config.cwd),
                publicPath: config.publicPath,
                defaultPort: config.port,
            });
        });
    }

    /**
     * 选择项目和分支
     * @returns 选中的项目路径和分支名称
     */
    private async selectProjectAndBranch(): Promise<{ selectedPath: string; selectedBranch: string }> {
        const list = await this.sql((db) => db.vue);
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
        const projectConfig = await this.getProjectConfigFromPath(selectedPath, options);
        if (!projectConfig) {
            return;
        }

        // 4. 打包项目
        projectConfig.branchName = selectedBranch;
        await this.buildProject(projectConfig);

        // 5. 确保有 publicPath
        if (!projectConfig.publicPath) {
            projectConfig.publicPath = (await this.getPublicPathFromConfig(selectedPath)) || '';
            if (!projectConfig.publicPath) {
                this.logger.error('无法获取 publicPath');
                return;
            }
        }

        // 6. 启动服务器
        await this.startServer(selectedPath, projectConfig.publicPath, projectConfig.port);
    }

    /**
     * 从路径获取项目配置
     * @param path 项目路径
     * @param options 命令选项
     * @returns 项目配置
     */
    private async getProjectConfigFromPath(path: string, options: Options): Promise<ProjectConfig | null> {
        const list = await this.sql((db) => db.vue);
        const project = list.find((item) => item.path === path);

        if (!project) {
            this.logger.error('找不到项目配置');
            return null;
        }

        return {
            cwd: path,
            command: project.command || 'build',
            port: options.port || project.defaultPort,
            publicPath: options.publicPath || project.publicPath,
        };
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
                port: globalConfig.port.production,
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
