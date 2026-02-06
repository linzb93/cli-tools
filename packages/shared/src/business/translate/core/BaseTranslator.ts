/**
 * 翻译结果项
 */
export interface TranslateResultItem {
    /**
     * 单词类型，如名词"n"，动词"v"等
     */
    type: string;
    /**
     * 翻译内容
     */
    content: string;
}

/**
 * 翻译策略接口
 */
export interface TranslatorStrategy {
    /**
     * 翻译器名称
     */
    name: string;
    /**
     * 执行翻译
     */
    translate: (text: string) => Promise<TranslateResultItem[]>;
}
