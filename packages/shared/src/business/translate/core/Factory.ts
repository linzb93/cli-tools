/**
 * 翻译器工厂类
 * 根据配置创建不同类型的翻译器实例
 */
import { Factory } from '@cli-tools/shared/base/BaseFactory';
import { BaseTranslator } from './BaseTranslator';
import { YoudaoTranslator } from '../implementations/YoudaoTranslator';
import { AiTranslator } from '../implementations/AiTranslator';

/**
 * 翻译器类型枚举
 */
export enum TranslatorType {
    YOUDAO = 'youdao',
    AI = 'ai',
}

/**
 * 翻译器工厂
 */
export class TranslatorFactory implements Factory<BaseTranslator> {
    /**
     * 创建翻译器实例
     * @param type 翻译器类型
     * @returns 翻译器实例
     */
    create(type: TranslatorType): BaseTranslator {
        switch (type) {
            case TranslatorType.YOUDAO:
                return new YoudaoTranslator();
            case TranslatorType.AI:
                return new AiTranslator();
            default:
                throw new Error(`不支持的翻译器类型: ${type}`);
        }
    }

    /**
     * 获取所有可用的翻译器类型
     * @returns 翻译器类型数组
     */
    static getAvailableTypes(): TranslatorType[] {
        return [TranslatorType.YOUDAO, TranslatorType.AI];
    }

    /**
     * 创建默认的翻译器组合（按优先级排序）
     * @param preferAI 是否优先使用AI翻译器
     * @returns 翻译器实例数组
     */
    static createDefaultTranslators(preferAI: boolean = false): BaseTranslator[] {
        const factory = new TranslatorFactory();

        if (preferAI) {
            return [factory.create(TranslatorType.AI), factory.create(TranslatorType.YOUDAO)];
        } else {
            return [factory.create(TranslatorType.YOUDAO), factory.create(TranslatorType.AI)];
        }
    }
}
