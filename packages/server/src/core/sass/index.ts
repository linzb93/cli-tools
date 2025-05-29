import fs from 'fs-extra';
import { resolve, join, basename, dirname } from 'node:path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import * as sass from 'sass';
import { sleep } from '@linzb93/utils';
import BaseCommand from '../BaseCommand';

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
        // 检查是否存在scss目录
        const scssDir = resolve(process.cwd(), 'scss');

        if (!(await fs.pathExists(scssDir))) {
            this.logger.error('当前项目中不存在scss目录');
            process.exit(1);
        }

        // 直接开启监听模式
        await this.startWatcher(scssDir);
    }

    /**
     * 开启sass监听服务
     * @param {string} scssDir - scss目录路径
     */
    private async startWatcher(scssDir: string): Promise<void> {
        this.watcher = chokidar.watch(join(scssDir, '**/*.scss'));

        this.watcher.once('ready', () => {
            this.logger.success(`sass编译服务已开启。`);
        });

        this.watcher.on('all', (event, fileParam) => {
            const file = fileParam.replace(/\\/g, '/');
            if (event === 'change') {
                this.logger.info(`文件${chalk.cyan(file)}发生修改`);
            } else if (event === 'unlink') {
                this.logger.info(`文件${chalk.cyan(file)}被移除`);
            }
        });

        this.watcher.on('add', (file) => {
            this.insertToRepo(file, this.depRepo);
        });

        this.watcher.on('change', async (file) => {
            // 在VSCode中编辑的文件会被上锁无法读取，所以需要等一段时间。
            await sleep(500);
            // 修改sass依赖图。清除该文件原有依赖，生成新的依赖关系。
            this.depRepo.forEach((item) => {
                const idx = item.refed.findIndex((sub) => sub === resolve(file));
                if (idx !== -1) {
                    item.refed.splice(idx, 1);
                }
            });

            await this.insertToRepo(file, this.depRepo);

            if (!this.isRefFile(file)) {
                await this.compileSassFile(file);
            } else {
                // 查找所有直接或间接用到该文件的非引用文件
                const matches: string[] = [];

                const getRefs = (filename: string) => {
                    const match = this.depRepo.find((item) => item.name === filename);
                    if (match) {
                        match.refed.forEach((sub) => {
                            if (this.isRefFile(sub)) {
                                getRefs(sub);
                            } else {
                                matches.push(sub);
                            }
                        });
                    }
                };

                getRefs(file);

                for (const item of matches) {
                    await this.compileSassFile(item);
                }
            }
        });

        this.watcher.on('unlink', async (file) => {
            if (!this.isRefFile(file)) {
                try {
                    await fs.unlink(file.replace('scss', 'wxss'));
                } catch (error) {
                    // 忽略错误
                }
            } else {
                const delMatch = this.depRepo.find((item) => item.name === resolve(file));
                if (delMatch) {
                    this.logger.warn(
                        `该删除的文件有被下列文件引用，\n请尽快修改，或还原被删除的文件：\n ${delMatch.refed.join(
                            '\n'
                        )}`
                    );
                }
            }

            this.depRepo.forEach((item, idx) => {
                if (item.name === resolve(file)) {
                    this.depRepo.splice(idx, 1);
                }
                const subIidx = item.refed.findIndex((sub) => sub === resolve(file));
                if (subIidx !== -1) {
                    item.refed.splice(subIidx, 1);
                }
            });
        });
    }

    /**
     * 编译单个sass文件
     * @param {string} file - 文件路径
     */
    private async compileSassFile(file: string): Promise<void> {
        try {
            const result = await new Promise<sass.LegacyResult>((resolve, reject) => {
                sass.render(
                    {
                        file,
                    },
                    (err, result) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(result);
                    }
                );
            });

            await fs.writeFile(file.replace('scss', 'wxss'), result.css.toString());
            this.logger.success(`文件 ${chalk.cyan(file)} 编译完成`);
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
