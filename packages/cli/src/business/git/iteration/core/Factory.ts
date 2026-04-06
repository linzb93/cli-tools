/**
 * 迭代策略工厂
 */
import { isGithubProject, isMonorepo } from '../../shared/utils/project-type';
import { BaseStrategy } from './BaseStrategy';
import {
    MinorReleaseStrategy,
    PatchReleaseStrategy,
    FixedBranchNamingStrategy,
    VersionedBranchNamingStrategy,
    CreateBranchIfNotExistsStrategy,
    PromptVersionIfExistsStrategy,
    CompositeIterationStrategy,
} from './strategies';

/** 预创建的策略单例 */
const releaseStrategies = {
    github: new MinorReleaseStrategy(),
    company: new PatchReleaseStrategy(),
};

const branchNamingStrategies = {
    github: new FixedBranchNamingStrategy(),
    company: new VersionedBranchNamingStrategy(),
};

const branchValidationStrategies = {
    github: new CreateBranchIfNotExistsStrategy(),
    company: new PromptVersionIfExistsStrategy(),
    companyMono: new PromptVersionIfExistsStrategy(),
};

/**
 * 根据项目信息创建迭代策略
 * @param projectPath 项目路径
 * @returns 迭代策略实例
 */
export const createIterationStrategy = async (projectPath: string): Promise<BaseStrategy> => {
    const isGithub = await isGithubProject();
    const isMono = await isMonorepo(projectPath);

    const releaseType = isGithub ? releaseStrategies.github : releaseStrategies.company;
    const branchNaming = isGithub ? branchNamingStrategies.github : branchNamingStrategies.company;
    const validation = isMono
        ? branchValidationStrategies.companyMono
        : isGithub
          ? branchValidationStrategies.github
          : branchValidationStrategies.company;

    const name = isGithub
        ? isMono
            ? 'GitHub Monorepo项目'
            : 'GitHub项目'
        : isMono
          ? '公司Monorepo项目'
          : '公司业务项目';

    return new CompositeIterationStrategy(releaseType, branchNaming, validation, name);
};
