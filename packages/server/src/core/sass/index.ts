import fs from 'fs-extra';
import { resolve, join, basename, dirname } from 'node:path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import * as sass from 'sass';
import { sleep } from '@linzb93/utils';
import BaseCommand from '../BaseCommand';
import { execaCommand as execa } from 'execa';

/**
 * Sass命令类
 * 用于编译scss文件并监听文件变化自动重新编译
 * 仅在当前项目的scss目录下运行
 */
export default class SassCommand extends BaseCommand {
    /**
     * 依赖图正则表达式
     */
    private reg = /@import "(.+)"/g;

    /**
     * 暂存sass依赖图
     * sass依赖图结构：
     * [{
     *  name: 文件名称
     *  refed: []依赖它的文件
     * }]
     */
    private depRepo: Array<{ name: string; refed: string[] }> = [];

    /**
     * 文件监听器
     */
    private watcher: chokidar.FSWatcher | null = null;

    constructor() {
        super();

        // 注册进程退出处理
        process.on('unhandledRejection', (e) => {
            console.log(e);
        });

        process.on('SIGINT', () => {
            console.log(chalk.yellow('关闭进程'));
            process.exit(1);
        });
    }

    /**
     * 命令主入口
     */
    async main(): Promise<void> {
        await this.compileChangedFiles();
        // 直接开启监听模式
        await this.startWatcher(process.cwd());
    }

    /**
     * 启动服务器时，编译已有变化的scss文件
     */
    async compileChangedFiles(): Promise<void> {
        const { stdout: files } = await execa('git diff --name-only');
        for (const file of files) {
            await this.handleFileChange(file);
        }
    }

    /**
     * 开启sass监听服务
     * @param {string} scssDir - scss目录路径
     */
    private async startWatcher(scssDir: string): Promise<void> {
        this.watcher = chokidar.watch(join(scssDir, '**/*.scss'));

        // 注册事件监听器
        this.registerReadyEvent();
        this.registerChangeEvents();
        this.registerAddEvent();
        this.registerChangeEvent();
        this.registerUnlinkEvent();
    }

    /**
     * 注册就绪事件监听
     */
    private registerReadyEvent(): void {
        if (!this.watcher) return;

        this.watcher.once('ready', () => {
            this.logger.success(`sass编译服务已开启。`);
        });
    }

    /**
     * 注册通用变更事件监听
     */
    private registerChangeEvents(): void {
        if (!this.watcher) return;

        this.watcher.on('all', (event, fileParam) => {
            const file = fileParam.replace(/\\/g, '/');
            if (event === 'change') {
                this.logger.info(`文件${chalk.cyan(file)}发生修改`);
            } else if (event === 'unlink') {
                this.logger.info(`文件${chalk.cyan(file)}被移除`);
            }
        });
    }

    /**
     * 注册文件添加事件监听
     */
    private registerAddEvent(): void {
        if (!this.watcher) return;

        this.watcher.on('add', (file) => {
            this.insertToRepo(file, this.depRepo);
        });
    }

    /**
     * 注册文件变更事件监听
     */
    private registerChangeEvent(): void {
        if (!this.watcher) return;

        this.watcher.on('change', async (file) => {
            await this.handleFileChange(file);
        });
    }

    /**
     * 处理文件变更
     * @param {string} file - 变更的文件路径
     */
    private async handleFileChange(file: string): Promise<void> {
        // 在VSCode中编辑的文件会被上锁无法读取，所以需要等一段时间。
        await sleep(500);

        // 更新依赖关系
        await this.updateDependencyRelations(file);

        if (!this.isRefFile(file)) {
            // 如果不是引用文件，直接编译
            await this.compileSassFile(file);
        } else {
            // 如果是引用文件，查找并编译所有依赖此文件的文件
            await this.compileAllDependentFiles(file);
        }
    }

    /**
     * 更新文件的依赖关系
     * @param {string} file - 文件路径
     */
    private async updateDependencyRelations(file: string): Promise<void> {
        // 清除该文件原有依赖
        this.depRepo.forEach((item) => {
            const idx = item.refed.findIndex((sub) => sub === resolve(file));
            if (idx !== -1) {
                item.refed.splice(idx, 1);
            }
        });

        // 重新生成依赖关系
        await this.insertToRepo(file, this.depRepo);
    }

    /**
     * 编译所有依赖指定文件的文件
     * @param {string} file - 引用文件路径
     */
    private async compileAllDependentFiles(file: string): Promise<void> {
        // 查找所有直接或间接用到该文件的非引用文件
        const matches: string[] = [];

        this.findAllDependentFiles(file, matches);

        // 编译所有依赖文件
        for (const item of matches) {
            await this.compileSassFile(item);
        }
    }

    /**
     * 查找所有依赖指定文件的文件
     * @param {string} filename - 文件路径
     * @param {string[]} matches - 结果数组
     */
    private findAllDependentFiles(filename: string, matches: string[]): void {
        const match = this.depRepo.find((item) => item.name === filename);
        if (match) {
            match.refed.forEach((sub) => {
                if (this.isRefFile(sub)) {
                    this.findAllDependentFiles(sub, matches);
                } else {
                    matches.push(sub);
                }
            });
        }
    }

    /**
     * 注册文件删除事件监听
     */
    private registerUnlinkEvent(): void {
        if (!this.watcher) return;

        this.watcher.on('unlink', async (file) => {
            await this.handleFileUnlink(file);
        });
    }

    /**
     * 处理文件删除
     * @param {string} file - 删除的文件路径
     */
    private async handleFileUnlink(file: string): Promise<void> {
        if (!this.isRefFile(file)) {
            // 如果不是引用文件，删除对应的编译文件
            await this.removeCompiledFile(file);
        } else {
            // 如果是引用文件，发出警告
            this.warnAboutReferencedFileDeletion(file);
        }

        // 更新依赖图
        this.updateDependencyGraph(file);
    }

    /**
     * 删除编译后的文件
     * @param {string} file - 文件路径
     */
    private async removeCompiledFile(file: string): Promise<void> {
        try {
            await fs.unlink(file.replace('scss', 'wxss'));
        } catch (error) {
            // 忽略错误
        }
    }

    /**
     * 警告引用文件被删除
     * @param {string} file - 文件路径
     */
    private warnAboutReferencedFileDeletion(file: string): void {
        const delMatch = this.depRepo.find((item) => item.name === resolve(file));
        if (delMatch) {
            this.logger.warn(
                `该删除的文件有被下列文件引用，\n请尽快修改，或还原被删除的文件：\n ${delMatch.refed.join('\n')}`
            );
        }
    }

    /**
     * 更新依赖图
     * @param {string} file - 文件路径
     */
    private updateDependencyGraph(file: string): void {
        // 删除文件本身在依赖图中的条目
        this.depRepo.forEach((item, idx) => {
            if (item.name === resolve(file)) {
                this.depRepo.splice(idx, 1);
            }
            // 删除其他文件对该文件的引用
            const subIidx = item.refed.findIndex((sub) => sub === resolve(file));
            if (subIidx !== -1) {
                item.refed.splice(subIidx, 1);
            }
        });
    }

    /**
     * 编译单个sass文件
     * @param {string} file - 文件路径
     */
    private async compileSassFile(file: string): Promise<void> {
        try {
            const result = await sass.compileAsync(file);
            await fs.writeFile(file.replace('scss', 'wxss'), result.css.toString());
        } catch (error) {
            this.logger.error(`编译 ${file} 失败: ${error}`);
        }
    }

    /**
     * 判断文件是否为引用文件
     * @param {string} file - 文件路径
     * @returns {boolean} 是否为引用文件
     */
    private isRefFile(file: string): boolean {
        return basename(file).startsWith('_');
    }

    /**
     * 将文件插入到依赖仓库
     * @param {string} file - 文件路径
     * @param {Array<{name: string, refed: string[]}>} depRepo - 依赖仓库
     */
    private async insertToRepo(file: string, depRepo: Array<{ name: string; refed: string[] }>): Promise<void> {
        try {
            const fullFile = resolve(process.cwd(), file);
            const content = await fs.readFile(file, 'utf8');
            let pattern: RegExpExecArray | null;

            this.reg.lastIndex = 0; // 重置正则表达式

            while ((pattern = this.reg.exec(content)) !== null) {
                const dependencyName = resolve(
                    dirname(fullFile),
                    pattern[1].endsWith('.scss') ? pattern[1] : `${pattern[1]}.scss`
                );

                const existingDep = depRepo.find((item) => item.name === dependencyName);

                if (existingDep) {
                    if (!existingDep.refed.includes(fullFile)) {
                        existingDep.refed.push(fullFile);
                    }
                } else {
                    depRepo.push({
                        name: dependencyName,
                        refed: [fullFile],
                    });
                }
            }
        } catch (error) {
            this.logger.error(`处理文件 ${file} 依赖关系时出错: ${error}`);
        }
    }
}
