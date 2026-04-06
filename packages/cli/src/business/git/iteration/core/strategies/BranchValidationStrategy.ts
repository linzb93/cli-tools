import inquirer from '@/utils/inquirer';
import semver from 'semver';
import type { IterationContext } from '../../types';
import { logger } from '@/utils/logger';
import { isGithubProject } from '../../../shared/utils/project-type';
import { checkBranchExist } from '../../../shared/utils';
/**
 * 分支验证策略接口
 */
export interface BranchValidationStrategy {
    /**
     * 验证并处理分支相关逻辑
     * @param ctx 迭代上下文
     */
    validate(ctx: IterationContext): Promise<void>;
}

/**
 * 分支不存在时创建分支的验证策略（用于 GitHub 非 Monorepo 项目）
 */
export class CreateBranchIfNotExistsStrategy implements BranchValidationStrategy {
    async validate(ctx: IterationContext): Promise<void> {
        const targetBranch = ctx.targetBranch;
        const isBranchExist = await checkBranchExist(targetBranch, ctx.projectPath);
        if (!isBranchExist) {
            const isDebug = process.env.MODE === 'cliTest';
            if (isDebug) {
                logger.info(`目标开发分支 ${targetBranch} 未创建，需要创建。`);
            } else {
                logger.info(`本地不存在 ${targetBranch} 分支，将新建...`);
            }
        }
    }
}

/**
 * 分支存在时提示用户输入新版本的验证策略（用于公司项目和 GitHub Monorepo 项目）
 */
export class PromptVersionIfExistsStrategy implements BranchValidationStrategy {
    async validate(ctx: IterationContext): Promise<void> {
        const { targetBranch } = ctx;
        const isBranchExist = await checkBranchExist(targetBranch, ctx.projectPath);
        if (isBranchExist && !(await isGithubProject(ctx.projectPath))) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'version',
                    message: `分支 ${targetBranch} 已存在，请输入新的版本号:`,
                    validate: async (input: string) => {
                        if (!input) return '版本号不能为空';
                        if (!semver.valid(input)) return '版本号无效';
                        const isExists = await checkBranchExist(`dev-${input}`, ctx.projectPath);
                        return isExists ? `分支 dev-${input} 依然存在，请重新输入` : true;
                    },
                },
            ]);
            ctx.finalVersion = answer.version;
            ctx.targetBranch = `dev-${answer.version}`;
            logger.info(`更新目标分支为 ${ctx.targetBranch}`);
        }
    }
}
