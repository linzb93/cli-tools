import chalk from 'chalk';
import { CheerioAPI } from 'cheerio';
import open from 'open';
import BaseCommand from '@/common/BaseCommand';
import { getPageUrl, getHtml } from '@/model/spider/translate';
import Ai from '../ai';

export interface Options {
    help: boolean;
}

/**
 * 使用有道词典API翻译。
 */
export default class extends BaseCommand {
    /**
     * 是否是中文翻译成英文
     */
    private isC2E = false;
    /**
     * @property {string} 待翻译的文本
     */
    private text = '';
    private strategyList = [
        {
            title: '有道词典',
            action: async (text: string) => {},
        },
    ];
    async main(text: string, options: Options): Promise<void> {
        this.isC2E = !/[a-z]+/.test(text);
        const strategyList = [
            {
                title: '有道词典',
                action: async () => {
                    return await this.getYoudaoMeanings(text);
                },
            },
            {
                title: 'AI翻译',
                action: async () => {
                    return await this.getAiMeanings(text);
                },
            },
        ];
        let match: {
            tool: string;
            result: {
                type: string;
                content: string;
            }[];
        } = {
            tool: '',
            result: [],
        };
        for (const strategy of strategyList) {
            try {
                const data = await strategy.action();
                match = {
                    tool: strategy.title,
                    result: data,
                };
                break;
            } catch (error) {
                continue;
            }
        }
        this.spinner.succeed();
        this.logger.box({
            title: this.isC2E ? '中文 => 英文' : '英文 => 中文',
            borderColor: 'red',
            content: `翻译内容：${chalk.cyan(text)}
翻译工具：${chalk.green(match.tool)}

翻译结果：
${match.result.length ? match.result.map((item) => `${chalk.gray(item.type)} ${item.content}`).join('\n\n') : '无'}`,
        });
    }
    private async getYoudaoMeanings(originText: string) {
        const $ = await getHtml(originText);
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
    }
    private async getAiMeanings(originText: string) {
        const ai = new Ai();
        const translateResult = await ai.use([
            {
                role: 'assistant',
                content: `你是一个中英文的翻译家，你需要判断用户提供的是中文还是英文。如果是中文，将其翻译成英文；如果是英文，将其翻译成中文。每个词汇类型，你提供最多3个翻译结果。用json格式输出结果，json不要换行。格式如下：
          - items: 翻译结果数组，每个元素包含type和content两个字段。
          - type: 单词类型，包含名词"n"，动词"v"，形容词"adj"，副词"adv"等。
          - content: 翻译结果，用分号隔开，分号后面不需要加空格。`,
            },
            {
                role: 'user',
                content: originText,
            },
        ]);
        try {
            return JSON.parse(translateResult).items;
        } catch (error) {
            return [];
        }
    }
}
