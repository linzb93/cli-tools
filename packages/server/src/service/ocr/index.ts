import BaseCommand from '@/common/BaseCommand';
import imageClipboard from '@/common/clipboard';
import { imageBase64ToStream, tempUpload } from '@/common/image';
import clipboardy from 'clipboardy';
import ai from '@/common/ai';
export default class extends BaseCommand {
    async main() {
        let removeHandler: any;
        const startTime = Date.now();
        try {
            const image = await imageClipboard.read();
            this.spinner.text = '正在识别图片';
            const ret = await tempUpload({
                type: 'stream',
                data: imageBase64ToStream(image),
            });
            const { url } = ret;
            removeHandler = ret.removeHandler;
            if (!url) {
                throw new Error('图片上传失败');
            }
            const result = await ai.use(
                [
                    {
                        role: 'assistant',
                        content: `你是一个图像识别工具。你需要识别用户上传的图像中的文字。如果图像内容是纯文本，就正常输出纯文本；如果图片里的内容是一张表格，请按照markdown格式直接输出表格。如果有识别到文本换行，请添加markdown的换行符。`,
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url,
                                    detail: 'high',
                                },
                            },
                        ],
                    },
                ],
                {
                    type: 'image',
                }
            );
            this.spinner.succeed(`识别成功，耗时${(Date.now() - startTime) / 1000}s，结果已复制到剪贴板`);
            clipboardy.writeSync(result);
            removeHandler();
        } catch (error) {
            if (typeof removeHandler === 'function') {
                removeHandler();
            }
            const { message } = error;
            if (message === 'no image found') {
                this.spinner.fail('剪贴板里面没有图片');
                return;
            }
            this.spinner.fail(message);
        }
    }
}
