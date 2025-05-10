import chalk from 'chalk';
import BaseCommand from '../BaseCommand';
import { getHtml } from '@/utils/http/spider';
import AiImpl from '@/core/ai/Impl';

export interface Options {
    /**
     * 是否使用AI翻译
     * @default false
     */
    ai: boolean;
}

/**
 * 使用有道词典API翻译。
 */
export default class extends BaseCommand {
    /**
     * 是否是中文翻译成英文
     */
    private isC2E = false;
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
        if (options.ai) {
            try {
                const data = await strategyList[1].action();
                match = {
                    tool: strategyList[1].title,
                    result: data,
                };
            } catch (error) {}
        }
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
        this.logTranslateResult(text, match.tool, match.result);
    }
    /**
     * 显示翻译结果
     * @param originText - 原文
     * @param title - 标题
     * @param result - 翻译结果
     */
    logTranslateResult(
        originText: string,
        title: string,
        result: {
            type: string;
            content: string;
        }[]
    ) {
        this.spinner.succeed();
        this.logger.box({
            title: this.isC2E ? '中文 => 英文' : '英文 => 中文',
            borderColor: 'red',
            content: `翻译内容：${chalk.cyan(originText)}
翻译工具：${chalk.green(title)}

翻译结果：
${result.length ? result.map((item) => `${chalk.gray(item.type)} ${item.content}`).join('\n\n') : '无'}`,
        });
    }
    /**
     * 使用AI翻译
     * @param originText - 原文
     */
    async translateByAI(originText: string) {
        const result = await this.getAiMeanings(originText);
        this.logTranslateResult(originText, 'AI翻译', result);
        this.spinner.succeed();
        return result[0].content;
    }
    private async getYoudaoMeanings(originText: string) {
        const $ = await this.getYoudaoHTML(originText);
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
    private getYoudaoHTML(text: string) {
        return getHtml('https://youdao.com/w/eng', `/${encodeURIComponent(text)}`);
    }
    private async getAiMeanings(originText: string) {
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
                content: originText,
            },
        ]);
        try {
            return JSON.parse(translateResult).items as {
                type: string;
                content: string;
            }[];
        } catch (error) {
            return [];
        }
    }
}
