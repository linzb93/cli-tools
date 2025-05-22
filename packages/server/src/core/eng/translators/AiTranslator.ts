import BaseTranslator, { TranslateResultItem } from './BaseTranslator';
import AiImpl from '@/core/ai/shared/ai-impl';

/**
 * AI翻译器
 */
export default class AiTranslator extends BaseTranslator {
    /**
     * 翻译器名称
     */
    readonly name = 'AI翻译';

    /**
     * 执行翻译
     * @param text - 需要翻译的文本
     * @returns 翻译结果数组
     */
    async translate(text: string): Promise<TranslateResultItem[]> {
        const translateResult = await new AiImpl().use([
            {
                role: 'assistant',
                content: `你是一个中英文的翻译家，你需要判断用户提供的是中文还是英文。如果是中文，将其翻译成英文；如果是英文，将其翻译成中文。如果原文不含有空格，每个词汇类型，你提供最多3个翻译结果，否则你只要提供1个翻译结果。用json格式输出结果，json不要换行。格式如下：
          - items: 翻译结果数组，每个元素包含type和content两个字段。
          - type: 单词类型，包含名词"n"，动词"v"，形容词"adj"，副词"adv"等。如果原文含有空格，type值用空字符串表示。
          - content: 翻译结果，用分号隔开，分号后面不需要加空格。`,
            },
            {
                role: 'user',
                content: text,
            },
        ]);

        try {
            const newText = translateResult.replace('```json', '').replace('```', '').trim();
            return JSON.parse(newText).items as TranslateResultItem[];
        } catch (error) {
            return [];
        }
    }
}
