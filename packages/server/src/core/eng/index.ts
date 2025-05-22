import chalk from 'chalk';
import BaseCommand from '../BaseCommand';
import { YoudaoTranslator, AiTranslator, type TranslateResultItem } from './translators';

export interface Options {
    /**
     * 是否使用AI翻译
     * @default false
     */
    ai: boolean;
}

/**
 * 翻译命令类
 */
export default class extends BaseCommand {
    /**
     * 是否是中文翻译成英文
     */
    private isC2E = false;

    /**
     * 主方法
     * @param text - 需要翻译的文本
     * @param options - 翻译选项
     */
    async main(text: string, options: Options): Promise<void> {
        this.isC2E = !/[a-z]+/.test(text);

        const youdaoTranslator = new YoudaoTranslator();
        const aiTranslator = new AiTranslator();

        let match: {
            tool: string;
            result: TranslateResultItem[];
        } = {
            tool: '',
            result: [],
        };

        // 如果指定使用AI翻译，先尝试AI翻译
        if (options.ai) {
            try {
                const data = await aiTranslator.translate(text);
                match = {
                    tool: aiTranslator.name,
                    result: data,
                };
            } catch (error) {}
        }

        // 如果AI翻译未成功或未指定使用AI翻译，则尝试所有翻译器
        if (!match.result.length) {
            const translators = [youdaoTranslator, aiTranslator];

            for (const translator of translators) {
                try {
                    const data = await translator.translate(text);
                    match = {
                        tool: translator.name,
                        result: data,
                    };
                    break;
                } catch (error) {
                    continue;
                }
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
    logTranslateResult(originText: string, title: string, result: TranslateResultItem[]) {
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
        const aiTranslator = new AiTranslator();
        const result = await aiTranslator.translate(originText);
        this.logTranslateResult(originText, aiTranslator.name, result);
        this.spinner.succeed();
        return result[0]?.content || '';
    }
}
