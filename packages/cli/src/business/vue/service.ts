import { showOpenDialog } from '@/utils/dialog';
import { execaCommand as execa } from 'execa';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import { join } from 'node:path';
import fs from 'fs-extra';
import { sql, type Database } from '@cli-tools/shared';
import * as git from '../git/shared/utils';
import { logger } from '@/utils/logger';
import spinner from '@/utils/spinner';
import inquirer from '@/utils/inquirer';
import type { Options, ProjectConfig } from './types';
import { startStaticServer } from './staticServer';

/**
 * 命令主入口
 * @param options 命令选项
 */
export const vueService = async (options: Options) => {
    // 获取项目配置
    const projectConfig = await getProjectConfig(options);
    if (!projectConfig) {
        return;
    }

    // 智能打包：检查 node版本和构建脚本
    if (!options.skip) {
        await smartBuildProject(projectConfig);
    }

    // 保存项目信息到数据库
    if (!options.select) {
        await saveProjectToDatabase(projectConfig);
    }

    // 启动服务器
    spinner.text = '正在启动静态服务...';
    try {
        const { url } = await startStaticServer({ cwd: projectConfig.cwd });
        spinner.succeed(`服务已启动\n${chalk.magenta(url)}`);
        clipboardy.writeSync(url);
    } catch (err) {
        spinner.fail('启动服务失败');
        logger.error(String(err));
    }
    process.exit(0);
};

/**
 * 智能打包流程
 * @param config 项目配置
 */
const smartBuildProject = async (config: ProjectConfig): Promise<void> => {
    logger.backwardConsole();

    const packageJsonPath = join(config.cwd, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
        logger.error('找不到 package.json，无法执行打包');
        return;
    }

    const pkg = await fs.readJSON(packageJsonPath);
    const scripts = pkg.scripts || {};

    // 找出所有 build 相关的命令
    const buildScripts = Object.keys(scripts).filter(
        (key) =>
            key.startsWith('build') ||
            scripts[key].includes('vue-cli-service build') ||
            scripts[key].includes('vite build'),
    );

    let targetCommand = 'build';

    if (buildScripts.length === 0) {
        logger.warn('未找到明显的构建脚本，将尝试执行 npm run build');
    } else if (buildScripts.length === 1) {
        targetCommand = buildScripts[0];
    } else {
        // 如果有多个，提示用户选择
        const { selectedScript } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedScript',
                message: '检测到多个构建命令，请选择一个执行',
                choices: buildScripts,
            },
        ]);
        targetCommand = selectedScript;
    }

    // 判断 Node.js 版本
    // 简单判断：如果包含 vue-cli-service 且可能是旧版本，尝试使用 v14
    let needsNode14 = false;
    if (await fs.pathExists(join(config.cwd, 'vue.config.js'))) {
        needsNode14 = true;
    }

    const branchName = await git.getCurrentBranchName(config.cwd);
    spinner.text = `正在项目${chalk.yellow(config.cwd)}(${chalk.blue(`${branchName}分支`)})执行命令：${chalk.green(`npm run ${targetCommand}`)}，请稍后...`;

    if (needsNode14) {
        spinner.text += chalk.gray(' (检测到旧版 Vue 项目，将通过服务端切换 Node.js v14 执行)');
        try {
            // 调用服务端接口切换 NVM 并打包
            const response = await fetch(`http://127.0.0.1:7001/api/nvm-switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cwd: config.cwd, command: `npm run ${targetCommand}` }),
            });
            if (!response.ok) {
                throw new Error(`服务端构建失败: ${response.statusText}`);
            }
        } catch (e) {
            logger.error(`调用 nvm-switch 失败，降级为本地构建: ${e}`);
            await execa(`npm run ${targetCommand}`, { cwd: config.cwd });
        }
    } else {
        await execa(`npm run ${targetCommand}`, { cwd: config.cwd });
    }
};

/**
 * 获取项目配置信息
 * @param options 命令选项
 * @returns 项目配置信息
 */
const getProjectConfig = async (options: Options): Promise<ProjectConfig | null> => {
    if (options.select) {
        return await getProjectConfigFromList();
    } else {
        return await getProjectConfigFromDialog(options);
    }
};

/**
 * 从列表中获取项目配置
 * @returns 项目配置信息
 */
const getProjectConfigFromList = async (): Promise<ProjectConfig | null> => {
    const list = (await sql((db) => db.vue)) as Database['vue'][number][];

    const { selectedId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedId',
            message: '请选择运行的项目及命令',
            choices: list.map((item) => ({
                name: item.path,
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
        publicPath: match.publicPath,
    };
};

/**
 * 从当前目录获取项目配置
 * @param options 命令选项
 * @returns 项目配置信息
 */
const getProjectConfigFromCurrent = (options: Options): ProjectConfig => {
    return {
        cwd: process.cwd(),
    };
};

/**
 * 从对话框选择获取项目配置
 * @param options 命令选项
 * @returns 项目配置信息
 */
const getProjectConfigFromDialog = async (options: Options): Promise<ProjectConfig | null> => {
    const cwd = await showOpenDialog('directory');
    if (!cwd) {
        logger.error('请选择项目路径');
        return null;
    }

    return {
        cwd,
    };
};

/**
 * 构建项目
 * @param config 项目配置
 */
const buildProject = async (config: ProjectConfig): Promise<void> => {
    logger.backwardConsole();

    // 获取当前分支
    const branchName = await git.getCurrentBranchName(config.cwd);

    // spinner.text = `正在项目${chalk.yellow(config.cwd)}(${chalk.blue(`${branchName}分支`)})执行命令：${chalk.green(
    //     `npm run ${config.command}`,
    // )}，请稍后...`;

    // await execa(`npm run ${config.command}`, { cwd: config.cwd });
};

/**
 * 从配置文件获取 publicPath
 * @param cwd 项目路径
 * @returns publicPath 值
 */
const getPublicPathFromConfig = async (cwd: string): Promise<string | undefined> => {
    try {
        const confFileContent = await fs.readFile(join(cwd, 'vue.config.js'), 'utf-8');
        const contentSeg = confFileContent.split('\n');
        const matchLine = contentSeg.find((line) => line.includes('publicPath:'));

        if (matchLine) {
            return matchLine.split(/: ?/)[1].trim().slice(1, -2);
        }
    } catch (error) {
        logger.error(`读取 vue.config.js 失败: ${error}`);
    }

    return undefined;
};

/**
 * 保存项目信息到数据库
 * @param config 项目配置
 */
const saveProjectToDatabase = async (config: ProjectConfig): Promise<void> => {
    if (!config.publicPath) {
        config.publicPath = (await getPublicPathFromConfig(config.cwd)) || '';
    }

    await sql((db) => {
        db.vue.push({
            id: db.vue.length + 1,
            path: config.cwd,
            publicPath: config.publicPath,
        });
    });
};

/**
 * 选择项目和分支
 * @returns 选中的项目路径和分支名称
 */
const selectProjectAndBranch = async (): Promise<{ selectedPath: string; selectedBranch: string }> => {
    const list = await sql((db) => db.vue);
    const pathList = Array.from(new Set(list.map((item) => item.path)));

    const { selectedPath } = await inquirer.prompt([
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

    const { selectedBranch } = await inquirer.prompt([
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
};

/**
 * 切换分支，打包并启动服务器
 * @param options 命令选项
 */
const checkoutBranchAndStartServer = async (options: Options) => {
    // 1. 选择项目和分支
    const { selectedPath, selectedBranch } = await selectProjectAndBranch();

    // 2. 切换分支
    spinner.text = `正在切换到分支: ${chalk.blue(selectedBranch)}`;
    await execa(`git checkout ${selectedBranch}`, { cwd: selectedPath });

    // 3. 获取项目的命令和配置
    const projectConfig = await getProjectConfigFromPath(selectedPath, options);
    if (!projectConfig) {
        return;
    }

    // 4. 打包项目
    await buildProject(projectConfig);

    // 5. 确保有 publicPath
    if (!projectConfig.publicPath) {
        projectConfig.publicPath = (await getPublicPathFromConfig(selectedPath)) || '';
        if (!projectConfig.publicPath) {
            logger.error('无法获取 publicPath');
            return;
        }
    }

    // 6. 启动服务器
    spinner.text = '正在启动静态服务...';
    try {
        const { url } = await startStaticServer({ cwd: selectedPath });
        spinner.succeed(`服务已启动\n${chalk.magenta(url)}`);
        clipboardy.writeSync(url);
    } catch (err) {
        spinner.fail('启动服务失败');
        logger.error(String(err));
    }
    process.exit(0);
};

/**
 * 从路径获取项目配置
 * @param path 项目路径
 * @param options 命令选项
 * @returns 项目配置
 */
const getProjectConfigFromPath = async (path: string, options: Options): Promise<ProjectConfig | null> => {
    const list = await sql((db) => db.vue);
    const project = list.find((item) => item.path === path);

    if (!project) {
        logger.error('找不到项目配置');
        return null;
    }

    return {
        cwd: path,
    };
};
