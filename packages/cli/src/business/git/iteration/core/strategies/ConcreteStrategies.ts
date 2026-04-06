import type { IterationContext } from '../../types';
import { BaseIterationStrategy } from '../BaseIterationStrategy';
import {
    MinorReleaseStrategy,
    PatchReleaseStrategy,
    FixedBranchNamingStrategy,
    VersionedBranchNamingStrategy,
    CreateBranchIfNotExistsStrategy,
    PromptVersionIfExistsStrategy,
} from './index';

/**
 * GitHub 非Monorepo 项目迭代策略
 * - 版本递增: minor
 * - 分支命名: 固定 'dev'
 * - 分支验证: 不存在则创建
 */
export class GithubIterationStrategy extends BaseIterationStrategy {
    readonly name = 'GitHub项目';

    constructor() {
        super(
            new MinorReleaseStrategy(),
            new FixedBranchNamingStrategy(),
            new CreateBranchIfNotExistsStrategy(),
        );
    }

    static matches(ctx: IterationContext): boolean {
        return ctx.isGithub && !ctx.isMono;
    }
}

/**
 * GitHub Monorepo 项目迭代策略
 * - 版本递增: minor
 * - 分支命名: 固定 'dev'
 * - 分支验证: 存在则提示输入新版本
 */
export class GithubMonoIterationStrategy extends BaseIterationStrategy {
    readonly name = 'GitHub Monorepo项目';

    constructor() {
        super(
            new MinorReleaseStrategy(),
            new FixedBranchNamingStrategy(),
            new PromptVersionIfExistsStrategy(),
        );
    }

    static matches(ctx: IterationContext): boolean {
        return ctx.isGithub && ctx.isMono;
    }
}

/**
 * 公司业务项目（非Monorepo）迭代策略
 * - 版本递增: patch
 * - 分支命名: 带版本号 'dev-${version}'
 * - 分支验证: 存在则提示输入新版本
 */
export class CompanyIterationStrategy extends BaseIterationStrategy {
    readonly name = '公司业务项目';

    constructor() {
        super(
            new PatchReleaseStrategy(),
            new VersionedBranchNamingStrategy(),
            new PromptVersionIfExistsStrategy(),
        );
    }

    static matches(ctx: IterationContext): boolean {
        return !ctx.isGithub && !ctx.isMono;
    }
}

/**
 * 公司 Monorepo 项目迭代策略
 * - 版本递增: patch
 * - 分支命名: 带版本号 'dev-${version}'
 * - 分支验证: 存在则提示输入新版本
 */
export class CompanyMonoIterationStrategy extends BaseIterationStrategy {
    readonly name = '公司Monorepo项目';

    constructor() {
        super(
            new PatchReleaseStrategy(),
            new VersionedBranchNamingStrategy(),
            new PromptVersionIfExistsStrategy(),
        );
    }

    static matches(ctx: IterationContext): boolean {
        return !ctx.isGithub && ctx.isMono;
    }
}

/** 所有策略类列表 */
export const ALL_STRATEGIES = [
    GithubMonoIterationStrategy,
    GithubIterationStrategy,
    CompanyMonoIterationStrategy,
    CompanyIterationStrategy,
] as const;
