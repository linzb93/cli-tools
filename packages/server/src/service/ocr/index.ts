import BaseCommand from '@/common/BaseCommand';
import imageClipboard from '@/common/clipboard';
import { imageBase64ToStream, tempUpload } from '@/common/image';
import clipboardy from 'clipboardy';
import Ai from '../ai';
export default class extends BaseCommand {
    async main() {
        try {
            const image = await imageClipboard.read();
            const { url, removeHandler } = await tempUpload({
                type: 'stream',
                data: imageBase64ToStream(image),
            });
            const ai = new Ai();
            const result = await ai.use(
                [
                    {
                        role: 'assistant',
                        content: `请识别图识别工具。你需要识别用户上传的图像中的文字。如果内容是文本，就正常输出纯文本；如果内容包含图片，就用'![]()'表示；如果包含标题或者表格，就输出markdown格式。`,
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
            this.logger.success('识别成功');
            clipboardy.writeSync(result);
            removeHandler();
        } catch (error) {
            this.logger.error('剪贴板里面没有图片');
            console.log(error);
        }
    }
}
