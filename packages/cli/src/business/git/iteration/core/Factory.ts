import type { IterationContext } from '../types';
import { BaseIterationStrategy } from './BaseIterationStrategy';
import { ALL_STRATEGIES } from './strategies';

/**
 * 根据项目信息创建迭代策略
 * @param ctx 迭代上下文
 * @returns 对应类型的迭代策略实例
 */
export const createIterationStrategy = (ctx: IterationContext): BaseIterationStrategy => {
    for (const StrategyClass of ALL_STRATEGIES) {
        if (StrategyClass.matches(ctx)) {
            return new StrategyClass();
        }
    }
    throw new Error('未找到匹配的迭代策略');
};
