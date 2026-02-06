import { TranslateResultItem, TranslatorStrategy } from '../core/BaseTranslator';
import { getHtml } from '../../../utils/http/spider';
import spinner from '../../../utils/spinner';

/**
 * 获取有道词典的HTML内容
 * @param text - 需要翻译的文本
 * @returns cheerio对象
 */
const getYoudaoHTML = (text: string) => {
    return getHtml('https://youdao.com/w/eng', `/${encodeURIComponent(text)}`);
};

/**
 * 有道翻译器
 */
export const youdaoTranslator: TranslatorStrategy = {
    name: '有道词典',
    translate: async (text: string): Promise<TranslateResultItem[]> => {
        spinner.start();
        spinner.text = '使用有道词典翻译中...';

        try {
            const $ = await getYoudaoHTML(text);
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
                    }),
            );

            if (arr.length) {
                return arr;
            }

            throw new Error('没有找到翻译结果');
        } catch (error) {
            spinner.text = '有道词典无结果，尝试其他翻译器...';
            throw error;
        }
    },
};
