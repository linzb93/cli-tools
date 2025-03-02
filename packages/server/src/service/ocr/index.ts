import BaseCommand from '@/common/BaseCommand';
import clipboardy from 'clipboardy';
import Ai from '../ai';
export default class extends BaseCommand {
    async main() {
        /**
         * 1. 读取剪贴板的图片，如果没有图片，报错，结束。因为macOS不支持访问剪贴板图片，所以要截图后存在本地，通过系统弹窗访问。
         * 2. 调用提示词，发给ai。
         * 3. 输出结果。如果含有table或者标题，就输出md格式，否则输出纯文本。
         */
        const ai = new Ai();
        const result = await ai.use([
            {
                role: 'assistant',
                content: `请识别图识别工具。你需要识别用户上传的图像中的文字。如果内容是文本，就正常输出纯文本；如果内容包含图片，就用'![]()'表示；如果包含标题或者表格，就输出markdown格式。`,
            },
        ]);
        this.logger.success('识别成功');
        clipboardy.writeSync(result);
    }
}
