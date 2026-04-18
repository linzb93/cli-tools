import { BaseStrategy } from '../core/BaseStrategy';
import { getContext } from '../shared';
/**
 * GitHub 非Monorepo 项目迭代策略
 * - 版本递增: minor
 * - 分支命名: 固定 'dev'
 * - 分支验证: 不存在则创建
 */
export class GithubStrategy extends BaseStrategy {
    readonly name = 'GitHub项目';

    static matches(): boolean {
        const ctx = getContext();
        return ctx.isGithub && !ctx.isMono;
    }
}
