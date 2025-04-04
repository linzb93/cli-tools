import getModels from './models';
export type MessageOptions =
    | {
          role: 'system' | 'assistant';
          content: string;
          name?: string;
      }
    | {
          role: 'user';
          content:
              | string
              | {
                    type: 'image_url';
                    image_url: {
                        url: string;
                        detail?: 'auto' | 'low' | 'high';
                    };
                }[];
      };
export default class {
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
