import imageClipboard from '@/utils/clipboard';
import { imageBase64ToStream, tempUpload } from '@/utils/image';
import clipboardy from 'clipboardy';
import BaseManager from '../../BaseManager';
import AiImpl from '../shared/ai-impl';
import { MessageOptions } from '../shared/types';
/**
 * 选项接口
 */
export interface Options {
    /**
     * 图片线上地址
     * @default ''
     */
    url: string;
}
/**
 * OCR功能类
 * 处理图像识别相关功能
 */
export class OCRManager extends BaseManager {
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
        this.spinner.text = '正在识别图片';
        try {
            const startTime = Date.now();
            let imageUrl: string;

            // 如果提供了URL，直接使用URL
            if (options.url) {
                imageUrl = options.url;
            } else {
                // 否则从剪贴板读取
                const image = await imageClipboard.read();
                const uploadInfo = await tempUpload({
                    type: 'stream',
                    data: imageBase64ToStream(image),
                });
                const { url, removeHandler } = uploadInfo;
                this.removeHandler = removeHandler;
                imageUrl = url;
            }

            const result = await this.processImage(imageUrl);
            clipboardy.writeSync(result);
            this.spinner.succeed(`识别成功，耗时${(Date.now() - startTime) / 1000}s，结果已复制到剪贴板`);

            // 如果是剪贴板图片，则清理临时文件
            if (!options.url) {
                this.cleanUp();
            }
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
     * 错误处理
     * @param error 错误对象
     */
    private handleError(error: any): void {
        this.cleanUp();
        const { message } = error;
        if (message === 'no image found') {
            this.spinner.fail('剪贴板里面没有图片');
            return;
        }
        this.spinner.fail(message);
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
