import BaseCommand from '../../BaseCommand';
import AiImpl from '../shared/ai-impl';
import { MessageOptions, Options } from '../shared/types';
import { printObject } from '../shared/utils';

/**
 * 正则表达式解析类
 * 处理正则表达式解析功能
 */
export default class Regex extends BaseCommand {
    /**
     * 提示内容
     */
    private prompt = '你是一个正则表达式解析工具。你需要解析用户输入的正则表达式，并输出解析结果。';

    /**
     * 主函数
     * @param input 输入内容
     * @param options 选项
     */
    async main(input: string, options: Options) {
        try {
            // 正则表达式中的反斜杠需要转义
            const processedInput = input.replace(/\\/g, '\\\\');
            await this.processRegex(processedInput);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 处理正则表达式解析
     * @param input 处理后的输入
     */
    private async processRegex(input: string): Promise<void> {
        const ai = new AiImpl();
        const params: MessageOptions[] = [
            {
                role: 'assistant',
                content: this.prompt,
            },
            {
                role: 'user',
                content: input,
            },
        ];

        const result = await ai.useStream(params);
        await printObject(result);
    }

    /**
     * 错误处理
     * @param error 错误对象
     */
    private handleError(error: any): void {
        console.log(error.message);
    }
}
