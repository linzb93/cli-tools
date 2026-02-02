import chalk from 'chalk';
import { BaseService } from '../../base/BaseService';
import { BaseTranslator, YoudaoTranslator, AiTranslator, type TranslateResultItem } from './implementations';

export interface Options {
    /**
     * 是否使用AI翻译
     * @default false
     */
    ai: boolean;
}
/**
 * 翻译服务类
 */
export class TranslateService extends BaseService {
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

        // 创建翻译器实例
        const youdaoTranslator = new YoudaoTranslator();
        const aiTranslator = new AiTranslator();

        // 传递spinner给翻译器
        youdaoTranslator.setSpinner(this.spinner);
        aiTranslator.setSpinner(this.spinner);

        // 定义翻译器数组
        let translators: BaseTranslator[] = [];

        // 根据选项决定翻译器顺序
        if (options.ai) {
            // 如果指定AI优先，则AI翻译器放在前面
            translators = [aiTranslator, youdaoTranslator];
        } else {
            // 默认有道翻译器在前
            translators = [youdaoTranslator, aiTranslator];
        }

        // 存储翻译结果
        let match: {
            tool: string;
            result: TranslateResultItem[];
        } = {
            tool: '',
            result: [],
        };

        // 依次尝试各个翻译器
        for (const translator of translators) {
            try {
                const data = await translator.translate(text);
                if (data && data.length) {
                    match = {
                        tool: translator.name,
                        result: data,
                    };
                    break; // 翻译成功则跳出循环
                }
            } catch (error) {
                // 当前翻译器失败，继续尝试下一个
                continue;
            }
        }

        // 所有翻译器都尝试失败
        if (!match.result.length) {
            this.spinner.text = '所有翻译器都无法翻译该内容';
            match.tool = '无可用翻译器';
            match.result = [{ type: '', content: '无法翻译，请检查输入内容或网络连接' }];
        }

        this.spinner.succeed('翻译完成');
        this.logTranslateResult(text, match.tool, match.result);
    }

    /**
     * 显示翻译结果
     * @param originText - 原文
     * @param title - 标题
     * @param result - 翻译结果
     */
    logTranslateResult(originText: string, title: string, result: TranslateResultItem[]) {
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
        aiTranslator.setSpinner(this.spinner);
        const result = await aiTranslator.translate(originText);

        if (!result.length) {
            this.spinner.text = 'AI翻译器无法翻译该内容';
            this.spinner.succeed('翻译完成');
            this.logTranslateResult(originText, aiTranslator.name, [
                { type: '', content: '无法翻译，请检查输入内容或网络连接' },
            ]);
            return '';
        }

        this.spinner.succeed('翻译完成');
        this.logTranslateResult(originText, aiTranslator.name, result);
        return result[0]?.content || '';
    }
}
