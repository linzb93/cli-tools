import { BaseStrategy } from '../core/BaseStrategy';
import { getContext } from '../shared';
import { updateMonorepoPackageJSON, updatePackageJSON } from '../delegates/updatePackageJSON';

/**
 * 公司 Monorepo 项目迭代策略
 * - 版本递增: patch
 * - 分支命名: 带版本号 'dev-${version}'
 * - 分支验证: 存在则提示输入新版本
 */
export class CompanyMonoStrategy extends BaseStrategy {
    readonly name = '公司Monorepo项目';

    static matches(): boolean {
        const ctx = getContext();
        return !ctx.isGithub && ctx.isMono;
    }
    override async updateProjectPackageJSON(pPath: string, version: string) {
        await updatePackageJSON(pPath, version);
        await updateMonorepoPackageJSON(pPath, version);
    }
}
