/**
 * 分支命名策略接口
 */
export interface BranchNamingStrategy {
    /**
     * 获取目标分支名
     * @param mainBranch 主分支名
     * @param version 版本号
     * @returns 目标分支名
     */
    getTargetBranch(mainBranch: string, version: string): string;
}

/**
 * 固定分支命名策略（用于 GitHub 项目，分支名固定为 'dev'）
 */
export class FixedBranchNamingStrategy implements BranchNamingStrategy {
    getTargetBranch(): string {
        return 'dev';
    }
}

/**
 * 带版本号的分支命名策略（用于公司项目，分支名为 'dev-${version}'）
 */
export class VersionedBranchNamingStrategy implements BranchNamingStrategy {
    getTargetBranch(_mainBranch: string, version: string): string {
        return `dev-${version}`;
    }
}
