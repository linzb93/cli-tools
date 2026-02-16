import imageClipboard from '@/utils/clipboard';
import { imageBase64ToStream, tempUpload } from '@/utils/image';
import clipboardy from 'clipboardy';
import spinner from '@/utils/spinner';
import { useAI } from '../common/implementation';
import { MessageOptions } from '../common/types';

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

const PROMPT =
    '你是一个图像识别工具。你需要识别用户上传的图像中的文字。如果图像内容是纯文本，就正常输出纯文本；如果图片里的内容是一张表格，请按照markdown格式直接输出表格。如果有识别到文本换行，请添加markdown的换行符。';

/**
 * 处理图像识别
 * @param imageUrl 图像URL
 * @returns 识别结果
 */
const processImage = async (imageUrl: string): Promise<string> => {
    const params: MessageOptions[] = [
        {
            role: 'assistant',
            content: PROMPT,
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

    const result = await useAI(params, { type: 'image' });
    return result.contents;
};

/**
 * OCR功能函数
 * 处理图像识别相关功能
 * @param options 选项
 */
export const ocrService = async (options: Options) => {
    let removeHandler: any = null;

    const cleanUp = () => {
        if (typeof removeHandler === 'function') {
            removeHandler();
            removeHandler = null;
        }
    };

    const handleError = (error: any) => {
        cleanUp();
        const { message } = error;
        if (message === 'no image found') {
            spinner.fail('剪贴板里面没有图片');
            return;
        }
        spinner.fail(message);
    };

    spinner.text = '正在识别图片';
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
            imageUrl = uploadInfo.url;
            removeHandler = uploadInfo.removeHandler;
        }

        const result = await processImage(imageUrl);
        clipboardy.writeSync(result);
        spinner.succeed(`识别成功，耗时${(Date.now() - startTime) / 1000}s，结果已复制到剪贴板`);

        // 如果是剪贴板图片，则清理临时文件
        if (!options.url) {
            cleanUp();
        }
    } catch (error) {
        handleError(error);
    }
};
