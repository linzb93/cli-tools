/**
 * 迭代策略工厂
 */
import { isGithubProject } from '../../git/shared/utils';
import { isMonorepo } from '../utils';
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
            ? 'GitHub Monorepo'
            : 'GitHub'
        : isMono
            ? 'Company Monorepo'
            : 'Company Business';

    return new CompositeIterationStrategy(releaseType, branchNaming, validation, name);
};
