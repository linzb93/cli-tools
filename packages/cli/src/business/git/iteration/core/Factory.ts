import { BaseStrategy } from './BaseStrategy';
import { ALL_STRATEGIES } from '../implementations';

/**
 * 根据项目信息创建迭代策略
 * @returns 对应类型的迭代策略实例
 */
export const createIterationStrategy = (): BaseStrategy => {
    for (const StrategyClass of ALL_STRATEGIES) {
        if (StrategyClass.matches()) {
            return new StrategyClass();
        }
    }
    throw new Error('未找到匹配的迭代策略');
};
