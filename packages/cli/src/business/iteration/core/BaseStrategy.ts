import type { IterationContext } from '../types';

/**
 * 迭代策略抽象基类
 */
export abstract class BaseStrategy {
    /** 策略名称 */
    abstract readonly name: string;

    /** 获取版本递增类型 */
    abstract getReleaseType(): 'major' | 'minor' | 'patch';

    /** 获取目标分支名 */
    abstract getTargetBranch(mainBranch: string, version: string): string;

    /** 策略特定的初始化或检查 */
    validate?(ctx: IterationContext): Promise<void>;
}

/**
 * 策略名称枚举
 */
export enum StrategyType {
    GITHUB = 'github',
    COMPANY_MONOREPO = 'company-monorepo',
    COMPANY_BUSINESS = 'company-business',
}
