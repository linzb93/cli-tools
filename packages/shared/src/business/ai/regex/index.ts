import { AiImplementation } from '../common/implementation';
import { MessageOptions } from '../common/types';
import { printObject } from '../common/utils/index';

const PROMPT = '你是一个正则表达式解析工具。你需要解析用户输入的正则表达式，并输出解析结果。';

/**
 * 处理正则表达式解析
 * @param input 处理后的输入
 */
const processRegex = async (input: string): Promise<void> => {
    const ai = new AiImplementation();
    const params: MessageOptions[] = [
        {
            role: 'assistant',
            content: PROMPT,
        },
        {
            role: 'user',
            content: input,
        },
    ];

    const result = await ai.useStream(params);
    await printObject(result);
};

const handleError = (error: any): void => {
    console.log(error.message);
};

/**
 * 正则表达式解析功能函数
 * 处理正则表达式解析功能
 * @param input 输入内容
 */
export const regexService = async (input: string) => {
    try {
        // 正则表达式中的反斜杠需要转义
        const processedInput = input.replace(/\\/g, '\\\\');
        await processRegex(processedInput);
    } catch (error) {
        handleError(error);
    }
};
