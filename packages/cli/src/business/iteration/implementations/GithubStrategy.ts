import { execaCommand } from 'execa';
import type { IterationContext } from '../types';
import { BaseStrategy } from '../core/BaseStrategy';
import { logger } from '@/utils/logger';

/**
 * GitHub 项目迭代策略
 */
export class GithubStrategy extends BaseStrategy {
    readonly name = 'GitHub';

    getReleaseType(): 'minor' {
        return 'minor';
    }

    getTargetBranch() {
        return 'dev';
    }

    async validate(ctx: IterationContext) {
        const targetBranch = this.getTargetBranch();
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

export const githubStrategy = new GithubStrategy();
