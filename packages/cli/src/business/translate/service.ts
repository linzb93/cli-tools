import chalk from 'chalk';
import { logger } from '@/utils/logger';
import spinner from '@/utils/spinner';
import inquirer from '@/utils/inquirer';
import { createDefaultTranslators, getTranslator, TranslatorType } from './core/Factory';
import { TranslateResultItem } from './core/BaseTranslator';
import { Options } from './types';
import { getClipboardContent, isUrl } from './utils';

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
                    tool: translator.name === 'AI翻译' ? `${data[0].model}翻译` : translator.name,
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
        logTranslateResult(
            originText,
            aiTranslator.name,
            [{ type: '', content: '无法翻译，请检查输入内容或网络连接' }],
            !/[a-z]+/.test(originText),
        );
        return '';
    }

    spinner.succeed('翻译完成');
    logTranslateResult(originText, aiTranslator.name, result, !/[a-z]+/.test(originText));
    return result[0]?.content || '';
};

/**
 * Eng命令服务
 * @param text - 输入文本
 * @param options - 选项
 */
export const engService = async (text: string | undefined, options: Options) => {
    // 1. 处理剪贴板选项 (-c/--clipboard)
    if (options.clipboard) {
        const content = getClipboardContent();
        if (!content || !content.trim()) {
            console.log(chalk.yellow('剪贴板为空'));
            return;
        }
        console.log(chalk.gray(`从剪贴板读取: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`));
        // 直接调用 AI 翻译
        await translateByAI(content);
        return;
    }

    // 2. 处理无参情况
    if (!text) {
        const { useClipboard } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useClipboard',
                message: '检测到未输入内容，是否读取剪贴板？',
                default: true,
            },
        ]);

        if (useClipboard) {
            const content = getClipboardContent();
            if (!content || !content.trim()) {
                console.log(chalk.yellow('剪贴板为空'));
                return;
            }

            // 显示预览
            console.log(chalk.cyan(`内容预览: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`));

            const { confirmTranslate } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmTranslate',
                    message: '是否翻译？',
                    default: true,
                },
            ]);

            if (confirmTranslate) {
                // 剪贴板内容默认使用 AI 翻译
                await translateByAI(content);
            }
        }
        return;
    }

    // 3. 处理 URL
    if (isUrl(text)) {
        console.log(chalk.blue('识别到URL，正在请求AI进行翻译...'));
        // 用户要求直接将 URL 发给 AI
        await translateByAI(text);
        return;
    }

    // 4. 普通翻译
    await translateService(text, options);
};
