import getModels from './models';
import { MessageOptions } from './types';

/**
 * AI实现类
 * 处理AI请求和响应
 */
export default class AiImpl {
    /**
     * 使用AI接口，返回完整响应
     * @param messages 消息数组
     * @param options 选项
     * @returns 完整的响应内容
     */
    async use(
        messages: MessageOptions[],
        options: {
            type: string;
        } = {
            type: 'text',
        }
    ) {
        const stream = await this.useStream(messages, options);
        let contents = '';
        // 打印回答内容
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            contents += content;
        }
        return contents;
    }

    /**
     * 使用AI接口，返回流式响应
     * @param messages 消息数组
     * @param options 选项
     * @returns 流式响应
     */
    async useStream(
        messages: MessageOptions[],
        options: {
            type: string;
        } = {
            type: 'text',
        }
    ) {
        const models = await getModels(options.type);
        const modelItem = models[0];
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
            baseURL: modelItem.baseURL,
            apiKey: modelItem.apiKey,
        });
        try {
            return await openai.chat.completions.create({
                model: modelItem.model,
                messages,
                stream: true,
            });
        } catch (error) {
            throw new Error(`${modelItem.title}服务使用失败：${modelItem.errorHandler(error.message)}`);
        }
    }
}
