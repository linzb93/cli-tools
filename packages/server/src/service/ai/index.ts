import * as semver from 'semver';
import BaseCommand from '@/common/BaseCommand';
import getModels from './models';

export interface Options {
    short: boolean;
    clear: boolean;
}

export interface MessageOptions {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export default class Ai extends BaseCommand {
    private contextFilePath = '';
    /**
     * 主函数，用于处理用户输入并调用OpenAI API获取回答
     * @param moduleName - 模块名称
     */
    async main(moduleName: string, options: Options) {}
    /**
     * 使用ai
     */
    async use(
        messages: MessageOptions[],
        options: {
            type: string;
        } = {
            type: 'text',
        }
    ) {
        const models = await getModels();
        const OpenAI = (await import('openai')).default;
        for (const modelItem of models) {
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
                this.logger.error(`${modelItem.title}服务使用失败：
                    ${modelItem.errorHandler(error.message)}
                    切换至下一个服务`);
                continue;
            }
        }
    }
}
