import { logger } from '@/utils/logger';
import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { createIterationStrategy } from './core/Factory';
import { isGithubProject, isMonorepo } from '../shared/utils/project-type';
import { calculateCommandTime } from '@/utils/execuate-command-line';
import type { IterationOptions } from './types';
import { isDebug } from './shared';
/**
 * iteration 命令的主编排流程
 * @param options 命令选项
 * @returns Promise<void>
 */
export const iterationService = async (options: IterationOptions): Promise<void> => {
    calculateCommandTime.start();
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
        // 创建策略
        const strategy = createIterationStrategy({
            isMono: await isMonorepo(projectPath),
            isGithub: await isGithubProject(projectPath),
        });
        logger.info(`检测到项目类型: ${strategy.name}`);

        await strategy.run({
            ...options,
            projectPath,
            pkgPath,
        });
        calculateCommandTime.end();
    } catch (error) {
        logger.error(`操作失败: ${(error as Error).message}`);
    }
};
