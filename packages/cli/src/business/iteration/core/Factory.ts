/**
 * 迭代策略工厂
 */
import { isGithubProject } from '../../git/shared/utils';
import { isMonorepo } from '../utils';
import { BaseStrategy } from './BaseStrategy';
import { githubStrategy } from '../implementations/GithubStrategy';
import { companyMonorepoStrategy } from '../implementations/CompanyMonorepoStrategy';
import { companyBusinessStrategy } from '../implementations/CompanyBusinessStrategy';

/**
 * 根据项目信息创建迭代策略
 * @param projectPath 项目路径
 * @returns 迭代策略实例
 */
export const createIterationStrategy = async (projectPath: string): Promise<BaseStrategy> => {
    const isGithub = await isGithubProject();
    const isMono = await isMonorepo(projectPath);

    if (isGithub) {
        return githubStrategy;
    }
    if (isMono) {
        return companyMonorepoStrategy;
    }
    return companyBusinessStrategy;
};
