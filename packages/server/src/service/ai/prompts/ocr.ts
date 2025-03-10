import imageClipboard from '@/common/clipboard';
import { imageBase64ToStream, tempUpload } from '@/common/image';
import clipboardy from 'clipboardy';
import spinner from '@/common/spinner';
import { PromptOptions } from '../share';

let removeHandler: any;

const obj: PromptOptions = {
    title: 'OCR',
    id: 'ocr',
    prompt: '你是一个图像识别工具。你需要识别用户上传的图像中的文字。如果图像内容是纯文本，就正常输出纯文本；如果图片里的内容是一张表格，请按照markdown格式直接输出表格。如果有识别到文本换行，请添加markdown的换行符。',
    type: 'image',
    async action(obj) {
        spinner.text = '正在识别图片';
        const startTime = Date.now();
        const image = await imageClipboard.read();
        const ret = await tempUpload({
            type: 'stream',
            data: imageBase64ToStream(image),
        });
        const { url } = ret;
        removeHandler = ret.removeHandler;
        const result = await obj.getResult(url);
        clipboardy.writeSync(result);
        spinner.succeed(`识别成功，耗时${(Date.now() - startTime) / 1000}s，结果已复制到剪贴板`);
        removeHandler();
    },
    catchHandler(error) {
        if (typeof removeHandler === 'function') {
            removeHandler();
        }
        const { message } = error;
        if (message === 'no image found') {
            spinner.fail('剪贴板里面没有图片');
            return;
        }
        spinner.fail(message);
    },
};
export default obj;
