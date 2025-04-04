import BaseCommand from '@/common/BaseCommand';
import prompts from './prompts';
import { type Options } from './share';
import AiImpl, { MessageOptions } from './Impl';
export { Options };

export default class Ai extends BaseCommand {
    async main(input: string, rest: string[], options: Options) {
        const match = prompts.find((pt) => pt.id === input);
        if (!match) {
            this.logger.error('没有匹配的ai工具，请检查输入是否正确。');
            return;
        }
        const ai = new AiImpl();
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
                        return ai.useStream(params, { type: 'image' });
                    }
                    return ai.use(params, {
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
                    return ai.useStream(params);
                }
                return ai.use(params);
            };
            await match.action({
                getResult,
                input: rest[0],
                options,
            });
        } catch (error) {
            match.catchHandler(error);
        }
    }
}
