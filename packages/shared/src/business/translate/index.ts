/**
 * 翻译模块统一入口
 * 使用工厂模式管理翻译器实例
 */
import chalk from 'chalk';
import { logger } from '@cli-tools/shared/utils/logger';
import spinner from '@cli-tools/shared/utils/spinner';
import { createDefaultTranslators, getTranslator, TranslatorType } from './core/Factory';
import { TranslateResultItem } from './core/BaseTranslator';

export interface Options {
    /**
     * 是否使用AI翻译
     * @default false
     */
    ai: boolean;
}

/**
 * 显示翻译结果
 * @param originText - 原文
 * @param title - 标题
 * @param result - 翻译结果
 * @param isC2E - 是否是中文转英文
 */
const logTranslateResult = (originText: string, title: string, result: TranslateResultItem[], isC2E: boolean) => {
    logger.box({
        title: isC2E ? '中文 => 英文' : '英文 => 中文',
        borderColor: 'red',
        content: `翻译内容：${chalk.cyan(originText)}
翻译工具：${chalk.green(title)}

翻译结果：
${result.length ? result.map((item) => `${chalk.gray(item.type)} ${item.content}`).join('\n\n') : '无'}`,
    });
};

/**
 * 翻译服务函数
 * @param text - 需要翻译的文本
 * @param options - 翻译选项
 */
export const translateService = async (text: string, options: Options): Promise<void> => {
    const isC2E = !/[a-z]+/.test(text);

    // 使用工厂创建翻译器数组
    const translators = createDefaultTranslators(options.ai);

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
        spinner.text = '所有翻译器都无法翻译该内容';
        match.tool = '无可用翻译器';
        match.result = [{ type: '', content: '无法翻译，请检查输入内容或网络连接' }];
    }

    spinner.succeed('翻译完成');
    logTranslateResult(text, match.tool, match.result, isC2E);
};

/**
 * 使用AI翻译
 * @param originText - 原文
 */
export const translateByAI = async (originText: string) => {
    const aiTranslator = getTranslator(TranslatorType.AI);
    const result = await aiTranslator.translate(originText);

    if (!result.length) {
        spinner.text = 'AI翻译器无法翻译该内容';
        spinner.succeed('翻译完成');
        logTranslateResult(originText, aiTranslator.name, [
            { type: '', content: '无法翻译，请检查输入内容或网络连接' },
        ], !/[a-z]+/.test(originText));
        return '';
    }

    spinner.succeed('翻译完成');
    logTranslateResult(originText, aiTranslator.name, result, !/[a-z]+/.test(originText));
    return result[0]?.content || '';
};
