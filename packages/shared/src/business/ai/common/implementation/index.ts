import getModels from './models';
import { MessageOptions } from '../types';

/**
 * 使用AI接口，返回流式响应
 * @param messages 消息数组
 * @param options 选项
 * @returns 包含流式响应和模型名称的对象
 */
export const useAIStream = async (
    messages: MessageOptions[],
    options: {
        type: string;
    } = {
        type: 'text',
    },
) => {
    const models = await getModels(options.type);
    if (models.length === 0) {
        throw new Error(`没有找到类型为 ${options.type} 的可用AI模型`);
    }
    const modelItem = models[0];
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
        baseURL: modelItem.baseURL,
        apiKey: modelItem.apiKey,
    });
    try {
        const stream = await openai.chat.completions.create({
            model: modelItem.model,
            messages: messages as any, // OpenAI types mismatch with MessageOptions sometimes
            stream: true,
        });
        return {
            stream,
            model: modelItem.title,
        };
    } catch (error: any) {
        throw new Error(`${modelItem.title}服务使用失败：${modelItem.errorHandler(error.message)}`);
    }
};

/**
 * 使用AI接口，返回完整响应
 * @param messages 消息数组
 * @param options 选项
 * @returns 完整的响应内容
 */
export const useAI = async (
    messages: MessageOptions[],
    options: {
        type: string;
    } = {
        type: 'text',
    },
) => {
    const { stream, model } = await useAIStream(messages, options);
    let contents = '';
    // 打印回答内容
    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        contents += content;
    }
    return { contents, model };
};
