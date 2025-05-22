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
 * 基础翻译器类
 */
export default abstract class BaseTranslator {
    /**
     * 翻译器名称
     */
    abstract readonly name: string;

    /**
     * 是否是中文翻译成英文
     */
    protected isC2E(text: string): boolean {
        return !/[a-z]+/.test(text);
    }

    /**
     * 执行翻译
     * @param text - 需要翻译的文本
     * @returns 翻译结果数组
     */
    abstract translate(text: string): Promise<TranslateResultItem[]>;
}
