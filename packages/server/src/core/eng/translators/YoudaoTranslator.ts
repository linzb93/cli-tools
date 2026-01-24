import BaseTranslator, { TranslateResultItem } from './BaseTranslator';
import { getHtml } from '@/utils/http/spider';

/**
 * 有道翻译器
 */
export default class YoudaoTranslator extends BaseTranslator {
    /**
     * 翻译器名称
     */
    readonly name = '有道词典';

    /**
     * 执行翻译
     * @param text - 需要翻译的文本
     * @returns 翻译结果数组
     */
    async translate(text: string): Promise<TranslateResultItem[]> {
        if (this.spinner) {
            this.spinner.start();
            this.spinner.text = '使用有道词典翻译中...';
        }

        try {
            const $ = await this.getYoudaoHTML(text);
            const arr = Array.from(
                $('.trans-container')
                    .first()
                    .children('ul')
                    .children()
                    .map((_, item) => {
                        const typeRet = $(item).text().replace(/\s/g, '');
                        if (typeRet.includes('.')) {
                            const types = typeRet.split('.');
                            return {
                                type: types[0],
                                content: types[1],
                            };
                        }
                        return {
                            type: '',
                            content: typeRet,
                        };
                    })
            );

            if (arr.length) {
                return arr;
            }

            throw new Error('没有找到翻译结果');
        } catch (error) {
            if (this.spinner) {
                this.spinner.text = '有道词典无结果，尝试其他翻译器...';
            }
            throw error;
        }
    }

    /**
     * 获取有道词典的HTML内容
     * @param text - 需要翻译的文本
     * @returns cheerio对象
     */
    public getYoudaoHTML(text: string) {
        return getHtml('https://youdao.com/w/eng', `/${encodeURIComponent(text)}`);
    }
}
