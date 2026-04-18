import { logger } from '@/utils/logger';
import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { createIterationStrategy } from './core/Factory';
import { isGithubProject, isMonorepo } from '../shared/utils/project-type';
import type { IterationOptions } from './types';
import { setContext, getContext } from './shared';
import { isDebug } from './shared';
/**
 * iteration 命令的主编排流程
 * @param options 命令选项
 * @returns Promise<void>
 */
export const iterationService = async (options: IterationOptions): Promise<void> => {
    const projectPath = process.cwd();
    const pkgPath = path.resolve(projectPath, 'package.json');

    if (!fs.existsSync(pkgPath)) {
        logger.error('未找到 package.json 文件');
        return;
    }

    if (isDebug) {
        logger.info(chalk.bgBlue.white(' === DEBUG 模式 (Dry Run) === '));
    }

    try {
        const pkg = await fs.readJSON(pkgPath);
        const currentVersion = pkg.version;
        // 构建上下文
        setContext({
            projectPath,
            pkgPath,
            currentVersion,
            isMono: await isMonorepo(projectPath),
            isGithub: await isGithubProject(projectPath),
            fix: options.fix,
        });
        // 创建策略
        const strategy = createIterationStrategy();
        logger.info(`检测到项目类型: ${strategy.name}`);

        await strategy.run(options);

        // 5. Debug 输出
        if (isDebug) {
            return;
        }
        const ctx = getContext();
        logger.success(`操作完成！当前处于 ${ctx.targetBranch} 分支，版本号已更新为 ${ctx.finalVersion}`);
    } catch (error) {
        logger.error(`操作失败: ${(error as Error).message}`);
    }
};
