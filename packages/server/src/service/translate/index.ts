import chalk from 'chalk';
import { CheerioAPI } from 'cheerio';
import open from 'open';
import BaseCommand from '@/common/BaseCommand';
import { getPageUrl, getHtml } from '@/model/spider/translate';
import Ai from '../ai';

export interface Options {
    /**
     * @default false
     * 是否显示示例
     */
    example: boolean;
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
    async main(text: string, options: Options): Promise<void> {
        this.isC2E = !/[a-z]+/.test(text);
        this.text = text;
        this.spinner.text = '正在查找';
        const $ = await getHtml(text);
        this.logger.backwardConsole();
        const meanings = this.getMeanings($);
        if (!meanings.length) {
            // 如果没有搜索结果，就打开页面自行查找
            const ai = new Ai();
            const translateResult = await ai.use([
                {
                    role: 'assistant',
                    content: `你是一个中英文的翻译家，你需要判断用户提供的是中文还是英文。如果是中文，将其翻译成英文；如果是英文，将其翻译成中文。你只需要提供最接近含义的翻译结果。用json格式输出结果，json不要换行。格式如下：
              - type: 单词类型，包含名词"n"，动词"v"，形容词"adj"，副词"adv"等。仅中译英的时候输出；
              - content: 翻译结果。`,
                },
                {
                    role: 'user',
                    content: text,
                },
            ]);
            // test
            this.spinner.succeed(`本次使用ai翻译：`);
            console.log(JSON.parse(translateResult));
            return;
        }
        this.spinner.succeed();
        const examples = options.example ? this.getExample($) : '';
        const meaningsOutput = `翻译内容：${chalk.cyan(text)}

翻译结果：
${meanings.join('\n\n')}`;
        const examplesOutput = `${
            !examples
                ? ''
                : `
示例语句：
${examples}`
        }`;
        this.logger.box({
            title: this.isC2E ? '中文 => 英文' : '英文 => 中文',
            borderColor: 'red',
            content: `${meaningsOutput}${examplesOutput}`,
        });
    }
    private getMeanings($: CheerioAPI) {
        return Array.from(
            $('.trans-container')
                .first()
                .children('ul')
                .children()
                .map((_, item) => {
                    const typeRet = $(item).text().replace(/\s/g, '');
                    if (typeRet.includes('.')) {
                        const type = typeRet.split('.')[0];
                        return `${chalk.gray(type)} ${typeRet.split('.')[1]}`;
                    }
                    return typeRet;
                })
        );
    }
    private getExample($: CheerioAPI) {
        const { text } = this;
        let examples = '';
        const arrs: { en: string; cn: string }[] = [];
        $('#bilingual')
            .find('li')
            .filter((index) => index < 2)
            .each((_, item) => {
                const $list = $(item).children('p');
                const $en = this.isC2E ? $list.eq(1) : $list.first();
                const enText = Array.from($en.children('span').map((_, sub) => $(sub).text())).join('');
                const $cn = this.isC2E ? $list.first() : $list.eq(1);
                const cnText = Array.from($cn.children('span').map((_, sub) => $(sub).text())).join('');
                if (this.isC2E) {
                    arrs.push({
                        en: enText,
                        cn: cnText.replace(text, chalk.green(text)),
                    });
                } else {
                    arrs.push({
                        en: enText.replace(text, chalk.green(text)),
                        cn: cnText,
                    });
                }
            });
        examples = arrs
            .map((item, index) => {
                if (this.isC2E) {
                    return `${index + 1}.${item.cn}\n${item.en}`;
                } else {
                    return `${index + 1}.${item.en}\n${item.cn}`;
                }
            })
            .join('\n\n');
        return examples;
    }
}
