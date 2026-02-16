/**
 * 翻译器工厂
 * 根据配置创建不同类型的翻译器
 */
import { TranslatorStrategy } from './BaseTranslator';
import { youdaoTranslator } from '../implementations/YoudaoTranslator';
import { aiTranslator } from '../implementations/AiTranslator';

/**
 * 翻译器类型枚举
 */
export enum TranslatorType {
    YOUDAO = 'youdao',
    AI = 'ai',
}

/**
 * 翻译器策略映射
 */
const strategies: Record<TranslatorType, TranslatorStrategy> = {
    [TranslatorType.YOUDAO]: youdaoTranslator,
    [TranslatorType.AI]: aiTranslator,
};

/**
 * 获取翻译器
 * @param type 翻译器类型
 * @returns 翻译器
 */
export const getTranslator = (type: TranslatorType): TranslatorStrategy => {
    const strategy = strategies[type];
    if (!strategy) {
        throw new Error(`不支持的翻译器类型: ${type}`);
    }
    return strategy;
};

/**
 * 获取所有可用的翻译器类型
 * @returns 翻译器类型数组
 */
export const getAvailableTypes = (): TranslatorType[] => {
    return [TranslatorType.YOUDAO, TranslatorType.AI];
};

/**
 * 创建默认的翻译器组合（按优先级排序）
 * @param preferAI 是否优先使用AI翻译器
 * @returns 翻译器数组
 */
export const createDefaultTranslators = (preferAI: boolean = false): TranslatorStrategy[] => {
    if (preferAI) {
        return [aiTranslator, youdaoTranslator];
    } else {
        return [youdaoTranslator, aiTranslator];
    }
};
