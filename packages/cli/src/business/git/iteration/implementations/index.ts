import { CompanyMonoStrategy } from './CompanyMonoStrategy';
import { GithubMonoStrategy } from './GithubMonoStrategy';
import { CompanyStrategy } from './CompanyStrategy';
import { GithubStrategy } from './GithubStrategy';
import { BaseStrategy } from '../core/BaseStrategy';
import { IProjectType } from '../types';

/**
 * 策略类约束：所有策略必须实现静态 matches 方法
 */
export interface StrategyClass {
    new (): BaseStrategy;
    matches(projectType: IProjectType): boolean;
}

export const ALL_STRATEGIES: StrategyClass[] = [
    CompanyMonoStrategy,
    GithubMonoStrategy,
    CompanyStrategy,
    GithubStrategy,
];
