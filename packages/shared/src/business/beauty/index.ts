import clipboardy from 'clipboardy';
import * as prettier from 'prettier';
import { CurlService } from '../curl';
import { logger } from '../../utils/logger';

export const beautyService = async () => {
    const curlService = new CurlService();
    // 目前只支持格式化剪贴板中的JSON内容
    const clipboardContent = clipboardy.readSync();
    let content = clipboardContent;
    if (curlService.isCurl(clipboardContent)) {
        content = curlService.getBodyFromCurl(clipboardContent);
    }
    try {
        JSON.parse(content);
    } catch (error) {
        logger.error('JSON 格式化失败');
        return;
    }
    const formatted = prettier.format(content, {
        parser: 'json',
    });
    clipboardy.writeSync(formatted);
    logger.success('JSON 格式化成功');
};
