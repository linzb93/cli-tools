import fs from 'fs-extra';
import { resolve, join, basename, dirname } from 'node:path';
import chalk from 'chalk';
import { execaCommand as execa } from 'execa';
import dayjs from 'dayjs';
import chokidar from 'chokidar';
import * as sass from 'sass';
import { sleep } from '@linzb93/utils';
import { logger } from '../../utils/logger';

/**
 * Sass依赖图结构
 */
interface DepNode {
    name: string;
    refed: string[];
}

/**
 * Sass服务上下文
 */
interface SassContext {
    depRepo: DepNode[];
    watcher: chokidar.FSWatcher | null;
    reg: RegExp;
}

/**
 * Sass命令主入口
 * 用于编译scss文件并监听文件变化自动重新编译
 * 仅在当前项目的scss目录下运行
 */
export const sassService = async (): Promise<void> => {
    const ctx: SassContext = {
        depRepo: [],
        watcher: null,
        reg: /@import "(.+)"/g,
    };

    // 注册进程退出处理
    process.on('unhandledRejection', (e) => {
        console.log(e);
    });

    process.on('SIGINT', () => {
        console.log(chalk.yellow('sass自动编译进程已关闭'));
        process.exit(1);
    });

    await compileChangedFiles(ctx);
    // 直接开启监听模式
    await startWatcher(process.cwd(), ctx);
};

/**
 * 启动服务器时，编译已有变化的scss文件
 */
const compileChangedFiles = async (ctx: SassContext): Promise<void> => {
    const { stdout: files } = await execa('git diff --name-only');
    const all = files.split('\n').filter(Boolean);
    const list = all.filter((item) => item.endsWith('.scss') && !all.includes(item.replace(/\.scss$/, '.wxss')));
    if (!list.length) {
        return;
    }
    logger.info(`编译已变更的scss文件：\n${list.map((item) => chalk.cyan(item)).join('\n')}`);
    for (const file of list) {
        await handleFileChange(file, ctx);
    }
};

/**
 * 开启sass监听服务
 * @param {string} scssDir - scss目录路径
 * @param {SassContext} ctx - 上下文
 */
const startWatcher = async (scssDir: string, ctx: SassContext): Promise<void> => {
    ctx.watcher = chokidar.watch(join(scssDir, '**/*.scss'));

    // 注册事件监听器
    registerReadyEvent(ctx);
    registerChangeEvents(ctx);
    registerAddEvent(ctx);
    registerChangeEvent(ctx);
    registerUnlinkEvent(ctx);
};

/**
 * 注册就绪事件监听
 */
const registerReadyEvent = (ctx: SassContext): void => {
    if (!ctx.watcher) return;

    ctx.watcher.once('ready', () => {
        logger.success(`sass编译服务已开启。`);
    });
};

/**
 * 注册通用变更事件监听
 */
const registerChangeEvents = (ctx: SassContext): void => {
    if (!ctx.watcher) return;

    ctx.watcher.on('all', (event, fileParam) => {
        const file = fileParam.replace(process.cwd(), '').replace(/\\/g, '/');
        if (event === 'change') {
            logger.info(`${chalk.blue(`[${dayjs().format('HH:mm:ss')}]`)}文件${chalk.cyan(file)}发生修改`);
        } else if (event === 'unlink') {
            logger.warn(`${chalk.blue(`[${dayjs().format('HH:mm:ss')}]`)}文件${chalk.cyan(file)}被移除`);
        }
    });
};

/**
 * 注册文件添加事件监听
 */
const registerAddEvent = (ctx: SassContext): void => {
    if (!ctx.watcher) return;

    ctx.watcher.on('add', (file) => {
        insertToRepo(file, ctx);
    });
};

/**
 * 注册文件变更事件监听
 */
const registerChangeEvent = (ctx: SassContext): void => {
    if (!ctx.watcher) return;

    ctx.watcher.on('change', async (file) => {
        await handleFileChange(file, ctx);
    });
};

/**
 * 处理文件变更
 * @param {string} file - 变更的文件路径
 * @param {SassContext} ctx - 上下文
 */
const handleFileChange = async (file: string, ctx: SassContext): Promise<void> => {
    // 在VSCode中编辑的文件会被上锁无法读取，所以需要等一段时间。
    await sleep(500);

    // 更新依赖关系
    await updateDependencyRelations(file, ctx);

    if (!isRefFile(file)) {
        // 如果不是引用文件，直接编译
        await compileSassFile(file);
    } else {
        // 如果是引用文件，查找并编译所有依赖此文件的文件
        await compileAllDependentFiles(file, ctx);
    }
};

/**
 * 更新文件的依赖关系
 * @param {string} file - 文件路径
 * @param {SassContext} ctx - 上下文
 */
const updateDependencyRelations = async (file: string, ctx: SassContext): Promise<void> => {
    // 清除该文件原有依赖
    ctx.depRepo.forEach((item) => {
        const idx = item.refed.findIndex((sub) => sub === resolve(file));
        if (idx !== -1) {
            item.refed.splice(idx, 1);
        }
    });

    // 重新生成依赖关系
    await insertToRepo(file, ctx);
};

/**
 * 编译所有依赖指定文件的文件
 * @param {string} file - 引用文件路径
 * @param {SassContext} ctx - 上下文
 */
const compileAllDependentFiles = async (file: string, ctx: SassContext): Promise<void> => {
    // 查找所有直接或间接用到该文件的非引用文件
    const matches: string[] = [];

    findAllDependentFiles(file, matches, ctx);

    // 编译所有依赖文件
    for (const item of matches) {
        await compileSassFile(item);
    }
};

/**
 * 查找所有依赖指定文件的文件
 * @param {string} filename - 文件路径
 * @param {string[]} matches - 结果数组
 * @param {SassContext} ctx - 上下文
 */
const findAllDependentFiles = (filename: string, matches: string[], ctx: SassContext): void => {
    const match = ctx.depRepo.find((item) => item.name === filename);
    if (match) {
        match.refed.forEach((sub) => {
            if (isRefFile(sub)) {
                findAllDependentFiles(sub, matches, ctx);
            } else {
                matches.push(sub);
            }
        });
    }
};

/**
 * 注册文件删除事件监听
 */
const registerUnlinkEvent = (ctx: SassContext): void => {
    if (!ctx.watcher) return;

    ctx.watcher.on('unlink', async (file) => {
        await handleFileUnlink(file, ctx);
    });
};

/**
 * 处理文件删除
 * @param {string} file - 删除的文件路径
 * @param {SassContext} ctx - 上下文
 */
const handleFileUnlink = async (file: string, ctx: SassContext): Promise<void> => {
    if (!isRefFile(file)) {
        // 如果不是引用文件，删除对应的编译文件
        await removeCompiledFile(file);
    } else {
        // 如果是引用文件，发出警告
        warnAboutReferencedFileDeletion(file, ctx);
    }

    // 更新依赖图
    updateDependencyGraph(file, ctx);
};

/**
 * 删除编译后的文件
 * @param {string} file - 文件路径
 */
const removeCompiledFile = async (file: string): Promise<void> => {
    try {
        await fs.unlink(file.replace('scss', 'wxss'));
    } catch (error) {
        // 忽略错误
    }
};

/**
 * 警告引用文件被删除
 * @param {string} file - 文件路径
 * @param {SassContext} ctx - 上下文
 */
const warnAboutReferencedFileDeletion = (file: string, ctx: SassContext): void => {
    const delMatch = ctx.depRepo.find((item) => item.name === resolve(file));
    if (delMatch) {
        logger.warn(
            `该删除的文件有被下列文件引用，\n请尽快修改，或还原被删除的文件：\n ${delMatch.refed.join('\n')}`,
        );
    }
};

/**
 * 更新依赖图
 * @param {string} file - 文件路径
 * @param {SassContext} ctx - 上下文
 */
const updateDependencyGraph = (file: string, ctx: SassContext): void => {
    // 删除文件本身在依赖图中的条目
    ctx.depRepo.forEach((item, idx) => {
        if (item.name === resolve(file)) {
            ctx.depRepo.splice(idx, 1);
        }
        // 删除其他文件对该文件的引用
        const subIidx = item.refed.findIndex((sub) => sub === resolve(file));
        if (subIidx !== -1) {
            item.refed.splice(subIidx, 1);
        }
    });
};

/**
 * 编译单个sass文件
 * @param {string} file - 文件路径
 */
const compileSassFile = async (file: string): Promise<void> => {
    try {
        const result = await sass.compileAsync(file);
        await fs.writeFile(file.replace('scss', 'wxss'), result.css.toString());
    } catch (error) {
        logger.error(`编译 ${file} 失败: ${error}`);
    }
};

/**
 * 判断文件是否为引用文件
 * @param {string} file - 文件路径
 * @returns {boolean} 是否为引用文件
 */
const isRefFile = (file: string): boolean => {
    return basename(file).startsWith('_');
};

/**
 * 将文件插入到依赖仓库
 * @param {string} file - 文件路径
 * @param {SassContext} ctx - 上下文
 */
const insertToRepo = async (file: string, ctx: SassContext): Promise<void> => {
    try {
        const fullFile = resolve(process.cwd(), file);
        const content = await fs.readFile(file, 'utf8');
        let pattern: RegExpExecArray | null;

        ctx.reg.lastIndex = 0; // 重置正则表达式

        while ((pattern = ctx.reg.exec(content)) !== null) {
            const dependencyName = resolve(
                dirname(fullFile),
                pattern[1].endsWith('.scss') ? pattern[1] : `${pattern[1]}.scss`,
            );

            const existingDep = ctx.depRepo.find((item) => item.name === dependencyName);

            if (existingDep) {
                if (!existingDep.refed.includes(fullFile)) {
                    existingDep.refed.push(fullFile);
                }
            } else {
                ctx.depRepo.push({
                    name: dependencyName,
                    refed: [fullFile],
                });
            }
        }
    } catch (error) {
        logger.error(`处理文件 ${file} 依赖关系时出错: ${error}`);
    }
};
