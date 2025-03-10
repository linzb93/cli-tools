import * as semver from 'semver';
import BaseCommand from '@/common/BaseCommand';
import getModels from './models';
import prompts from './prompts';

type MessageOptions =
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

export default class Ai extends BaseCommand {
    async main(input: string, rest: string[]) {
        const match = prompts.find((pt) => pt.id === input);
        if (!match) {
            this.logger.error('没有匹配的ai工具，请检查输入是否正确。');
            return;
        }
        try {
            const getResult = (data: string) => {
                if (match.type === 'image') {
                    const params: MessageOptions[] = [
                        {
                            role: 'assistant',
                            content: match.prompt,
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: data,
                                        detail: 'high',
                                    },
                                },
                            ],
                        },
                    ];
                    if (match.stream) {
                        return this.useStream(params, { type: 'image' });
                    }
                    return this.use(params, {
                        type: 'image',
                    });
                }
                const params: MessageOptions[] = [
                    {
                        role: 'assistant',
                        content: match.prompt,
                    },
                    {
                        role: 'user',
                        content: data,
                    },
                ];
                if (match.stream) {
                    return this.useStream(params);
                }
                return this.use(params);
            };
            await match.action({
                getResult,
                input: rest[0],
            });
        } catch (error) {
            match.catchHandler(error);
        }
    }

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
        if (semver.lt(process.version, '18.0.0')) {
            throw new Error('请将node版本切换至18.0.0以上');
        }
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
            throw new Error(`${modelItem.title}服务使用失败：
                        ${modelItem.errorHandler(error.message)}`);
        }
    }
}
