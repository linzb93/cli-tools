import { BaseStrategy } from '../core/BaseStrategy';
import { updateMonorepoPackageJSON, updatePackageJSON } from '../delegates/updatePackageJSON';
import { IProjectType } from '../types';
/**
 * 公司 Monorepo 项目迭代策略
 * - 版本递增: patch
 * - 分支命名: 带版本号 'dev-${version}'
 * - 分支验证: 存在则提示输入新版本
 */
export class CompanyMonoStrategy extends BaseStrategy {
    readonly name = '公司Monorepo项目';

    static matches(projectType: IProjectType): boolean {
        return !projectType.isGithub && projectType.isMono;
    }
    override async updateProjectPackageJSON({
        projectPath,
        pkgPath,
        version,
    }: {
        projectPath: string;
        pkgPath: string;
        version: string;
    }) {
        await updatePackageJSON(projectPath, pkgPath, version);
        await updateMonorepoPackageJSON(projectPath, pkgPath, version);
    }
}
