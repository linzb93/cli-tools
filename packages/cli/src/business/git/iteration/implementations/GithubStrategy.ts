import { BaseStrategy } from '../core/BaseStrategy';
import { IProjectType } from '../types';

/**
 * GitHub 非Monorepo 项目迭代策略
 * - 版本递增: minor
 * - 分支命名: 固定 'dev'
 * - 分支验证: 不存在则创建
 */
export class GithubStrategy extends BaseStrategy {
    readonly name = 'GitHub项目';

    static matches(projectType: IProjectType): boolean {
        return projectType.isGithub && !projectType.isMono;
    }
}
