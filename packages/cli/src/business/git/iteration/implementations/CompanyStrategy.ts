import type { ReleaseType } from 'semver';
import { BaseStrategy } from '../core/BaseStrategy';
import { getContext } from '../shared';
/**
 * 公司业务项目（非Monorepo）迭代策略
 * - 版本递增: patch
 * - 分支命名: 带版本号 'dev-${version}'
 * - 分支验证: 存在则提示输入新版本
 */
export class CompanyStrategy extends BaseStrategy {
    readonly name = '公司业务项目';

    override releaseType: ReleaseType = 'patch';

    static matches(): boolean {
        const ctx = getContext();
        return !ctx.isGithub && !ctx.isMono;
    }
    override getTargetBranch(): string {
        const { finalVersion } = getContext();
        return `dev-${finalVersion}`;
    }
}
