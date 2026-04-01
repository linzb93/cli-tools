import { execaCommand } from 'execa';
import inquirer from '@/utils/inquirer';
import semver from 'semver';
import type { IterationContext } from '../../types';
import { logger } from '@/utils/logger';

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
        let isBranchExist = false;
        try {
            await execaCommand(`git show-ref --verify --quiet refs/heads/${targetBranch}`);
            isBranchExist = true;
        } catch {
            isBranchExist = false;
        }

        if (!isBranchExist) {
            logger.info(`本地不存在 ${targetBranch} 分支，将新建...`);
            (ctx as any).shouldCreateBranch = true;
        }
    }
}

/**
 * 分支存在时提示用户输入新版本的验证策略（用于公司项目和 GitHub Monorepo 项目）
 */
export class PromptVersionIfExistsStrategy implements BranchValidationStrategy {
    async validate(ctx: IterationContext): Promise<void> {
        const { targetBranch } = ctx;
        let isBranchExist = false;
        try {
            await execaCommand(`git show-ref --verify --quiet refs/heads/${targetBranch}`);
            isBranchExist = true;
        } catch {
            isBranchExist = false;
        }

        if (isBranchExist) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'version',
                    message: `分支 ${targetBranch} 已存在，请输入新的版本号:`,
                    validate: async (input: string) => {
                        if (!input) return '版本号不能为空';
                        if (!semver.valid(input)) return '版本号无效';
                        try {
                            await execaCommand(`git show-ref --verify --quiet refs/heads/dev-${input}`);
                            return `分支 dev-${input} 依然存在，请重新输入`;
                        } catch {
                            return true;
                        }
                    },
                },
            ]);
            ctx.finalVersion = answer.version;
            ctx.targetBranch = `dev-${answer.version}`;
            logger.info(`更新目标分支为 ${ctx.targetBranch}`);
        }
    }
}
