/**
 * 版本发布类型策略接口
 */
export interface ReleaseTypeStrategy {
    /**
     * 获取版本递增类型
     * @returns 'major' | 'minor' | 'patch'
     */
    getReleaseType(): 'major' | 'minor' | 'patch';
}

/**
 * Minor 版本递增策略（用于 GitHub 项目）
 */
export class MinorReleaseStrategy implements ReleaseTypeStrategy {
    getReleaseType(): 'minor' {
        return 'minor';
    }
}

/**
 * Patch 版本递增策略（用于公司项目）
 */
export class PatchReleaseStrategy implements ReleaseTypeStrategy {
    getReleaseType(): 'patch' {
        return 'patch';
    }
}
