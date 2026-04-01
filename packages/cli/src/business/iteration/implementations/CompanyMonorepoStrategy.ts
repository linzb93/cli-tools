import { execaCommand } from 'execa';
import inquirer from '@/utils/inquirer';
import semver from 'semver';
import type { IterationContext } from '../types';
import { BaseStrategy } from '../core/BaseStrategy';
import { logger } from '@/utils/logger';

/**
 * 公司 Monorepo 项目迭代策略
 */
export class CompanyMonorepoStrategy extends BaseStrategy {
    readonly name = 'Company Monorepo';

    getReleaseType(): 'patch' {
        return 'patch';
    }

    getTargetBranch(_mainBranch: string, version: string) {
        return `dev-${version}`;
    }

    async validate(ctx: IterationContext) {
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

export const companyMonorepoStrategy = new CompanyMonorepoStrategy();
