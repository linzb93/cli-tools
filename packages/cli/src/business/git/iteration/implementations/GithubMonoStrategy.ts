import { BaseStrategy } from '../core/BaseStrategy';
import { updateMonorepoPackageJSON, updatePackageJSON } from '../delegates/updatePackageJSON';
import { IProjectType } from '../types';
/**
 * GitHub Monorepo 项目迭代策略
 * - 版本递增: minor
 * - 分支命名: 固定 'dev'
 * - 分支验证: 存在则提示输入新版本
 */
export class GithubMonoStrategy extends BaseStrategy {
    readonly name = 'GitHub Monorepo项目';

    static matches(projectType: IProjectType): boolean {
        return projectType.isGithub && projectType.isMono;
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
