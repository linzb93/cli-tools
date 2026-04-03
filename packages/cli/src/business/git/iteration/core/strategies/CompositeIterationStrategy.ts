import type { IterationContext } from '../../types';
import { BaseStrategy } from '../BaseStrategy';
import type { ReleaseTypeStrategy } from './ReleaseTypeStrategy';
import type { BranchNamingStrategy } from './BranchNamingStrategy';
import type { BranchValidationStrategy } from './BranchValidationStrategy';

/**
 * 组合迭代策略
 * 通过组合三个维度的策略来实现迭代逻辑
 */
export class CompositeIterationStrategy extends BaseStrategy {
    constructor(
        private releaseType: ReleaseTypeStrategy,
        private branchNaming: BranchNamingStrategy,
        private branchValidation: BranchValidationStrategy,
        public readonly name: string
    ) {
        super();
    }

    getReleaseType() {
        return this.releaseType.getReleaseType();
    }

    getTargetBranch(mainBranch: string, version: string) {
        return this.branchNaming.getTargetBranch(mainBranch, version);
    }

    async validate(ctx: IterationContext): Promise<void> {
        await this.branchValidation.validate(ctx);
    }
}
