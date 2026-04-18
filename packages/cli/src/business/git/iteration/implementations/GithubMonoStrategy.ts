import { BaseStrategy } from '../core/BaseStrategy';
import { getContext } from '../shared';
import { updateMonorepoPackageJSON, updatePackageJSON } from '../delegates/updatePackageJSON';
/**
 * GitHub Monorepo 项目迭代策略
 * - 版本递增: minor
 * - 分支命名: 固定 'dev'
 * - 分支验证: 存在则提示输入新版本
 */
export class GithubMonoStrategy extends BaseStrategy {
    readonly name = 'GitHub Monorepo项目';

    static matches(): boolean {
        const ctx = getContext();
        return ctx.isGithub && ctx.isMono;
    }
    override async updateProjectPackageJSON(pPath: string, version: string) {
        await updatePackageJSON(pPath, version);
        await updateMonorepoPackageJSON(pPath, version);
    }
}
