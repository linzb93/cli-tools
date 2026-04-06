import type { IterationContext } from '../types';
import type { ReleaseTypeStrategy } from './strategies/ReleaseTypeStrategy';
import type { BranchNamingStrategy } from './strategies/BranchNamingStrategy';
import type { BranchValidationStrategy } from './strategies/BranchValidationStrategy';

/**
 * 迭代策略抽象基类
 * 通过依赖注入接收三个策略委托
 */
export abstract class BaseIterationStrategy {
    /** 策略名称 */
    abstract readonly name: string;

    protected constructor(
        protected readonly releaseTypeStrategy: ReleaseTypeStrategy,
        protected readonly branchNamingStrategy: BranchNamingStrategy,
        protected readonly branchValidationStrategy: BranchValidationStrategy,
    ) {}

    /** 获取版本递增类型 */
    getReleaseType(): 'major' | 'minor' | 'patch' {
        return this.releaseTypeStrategy.getReleaseType();
    }

    /** 获取目标分支名 */
    getTargetBranch(mainBranch: string, version: string): string {
        return this.branchNamingStrategy.getTargetBranch(mainBranch, version);
    }

    /** 验证分支 */
    async validate(ctx: IterationContext): Promise<void> {
        await this.branchValidationStrategy.validate(ctx);
    }
}
