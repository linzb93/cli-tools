import imageClipboard from '@/utils/clipboard';
import { imageBase64ToStream, tempUpload } from '@/utils/image';
import inquirer from '@/utils/inquirer';
import clipboardy from 'clipboardy';
import spinner from '@/utils/spinner';
import BaseCommand from '../../BaseCommand';
import AiImpl from '../shared/ai-impl';
import { MessageOptions, Options } from '../shared/types';

/**
 * OCR功能类
 * 处理图像识别相关功能
 */
export default class OCR extends BaseCommand {
    /**
     * 移除临时上传文件的处理函数
     */
    private removeHandler: any = null;

    /**
     * 提示内容
     */
    private prompt =
        '你是一个图像识别工具。你需要识别用户上传的图像中的文字。如果图像内容是纯文本，就正常输出纯文本；如果图片里的内容是一张表格，请按照markdown格式直接输出表格。如果有识别到文本换行，请添加markdown的换行符。';

    /**
     * 主函数
     * @param options 选项
     */
    async main(options: Options) {
        spinner.text = '正在识别图片';
        try {
            const startTime = Date.now();
            const image = await imageClipboard.read();
            const ret = await tempUpload({
                type: 'stream',
                data: imageBase64ToStream(image),
            });
            const { url } = ret;
            this.removeHandler = ret.removeHandler;

            const result = await this.processImage(url);
            clipboardy.writeSync(result);
            spinner.succeed(`识别成功：\n${result}`);

            if (options.ask) {
                await this.handleAdditionalQuestion(result);
                return;
            }

            spinner.succeed(`识别成功，耗时${(Date.now() - startTime) / 1000}s，结果已复制到剪贴板`);
            this.cleanUp();
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 处理图像识别
     * @param imageUrl 图像URL
     * @returns 识别结果
     */
    private async processImage(imageUrl: string): Promise<string> {
        const ai = new AiImpl();
        const params: MessageOptions[] = [
            {
                role: 'assistant',
                content: this.prompt,
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl,
                            detail: 'high',
                        },
                    },
                ],
            },
        ];

        return ai.use(params, { type: 'image' });
    }

    /**
     * 处理额外的问题
     * @param result 识别结果
     */
    private async handleAdditionalQuestion(result: string): Promise<void> {
        const { askResult } = await inquirer.prompt({
            type: 'input',
            name: 'askResult',
            message: '请针对识别结果提问',
        });

        await new AiImpl().use([
            {
                role: 'user',
                content: `${askResult}。如果是纯英文的话，请先翻译成中文，再给出解决方案。\n${result}`,
            },
        ]);
    }

    /**
     * 错误处理
     * @param error 错误对象
     */
    private handleError(error: any): void {
        this.cleanUp();
        const { message } = error;
        if (message === 'no image found') {
            spinner.fail('剪贴板里面没有图片');
            return;
        }
        spinner.fail(message);
    }

    /**
     * 清理资源
     */
    private cleanUp(): void {
        if (typeof this.removeHandler === 'function') {
            this.removeHandler();
            this.removeHandler = null;
        }
    }
}
