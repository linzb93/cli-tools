import { BaseStrategy } from './BaseStrategy';
import { ALL_STRATEGIES } from '../implementations';
import { IProjectType } from '../types';

/**
 * 根据项目信息创建迭代策略
 * @returns 对应类型的迭代策略实例
 */
export const createIterationStrategy = (projectType: IProjectType): BaseStrategy => {
    for (const StrategyClass of ALL_STRATEGIES) {
        if (StrategyClass.matches(projectType)) {
            return new StrategyClass();
        }
    }
    throw new Error('未找到匹配的迭代策略');
};
