import * as semver from 'semver';
import BaseCommand from '@/common/BaseCommand';
import getModels from './models';
// import {type ChatCompletionContentPartText} from 'openai';

export interface Options {
    short: boolean;
    clear: boolean;
}

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
const ai = {
    async use(
        messages: MessageOptions[],
        options: {
            type: string;
        } = {
            type: 'text',
        }
    ) {
        if (semver.lt(process.version, '18.0.0')) {
            throw new Error('请将node版本切换至18.0.0以上');
        }
        const models = await getModels(options.type);
        const OpenAI = (await import('openai')).default;
        for (let i = 0; i < models.length; i++) {
            const modelItem = models[i];
            const openai = new OpenAI({
                baseURL: modelItem.baseURL,
                apiKey: modelItem.apiKey,
            });
            try {
                const stream = await openai.chat.completions.create({
                    model: modelItem.model,
                    messages,
                    stream: true,
                });
                let contents = '';
                // 打印回答内容
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    contents += content;
                }
                return contents;
            } catch (error) {
                console.log(`${modelItem.title}服务使用失败：
                    ${modelItem.errorHandler(error.message)}
                    切换至下一个服务`);
                continue;
            }
        }
    },
};
export default ai;
