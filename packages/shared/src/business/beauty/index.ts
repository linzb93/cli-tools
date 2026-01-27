import BaseService from '../core/BaseService.abstract';
import clipboardy from 'clipboardy';
import * as prettier from 'prettier';
import { CurlService } from '../curl';

export class BeautyService extends BaseService {
    private curlService: CurlService;
    constructor() {
        super();
        this.curlService = new CurlService();
    }
    async main() {
        // 目前只支持格式化剪贴板中的JSON内容
        const clipboardContent = clipboardy.readSync();
        let content = clipboardContent;
        if (this.curlService.isCurl(clipboardContent)) {
            content = this.curlService.getBodyFromCurl(clipboardContent);
        }
        try {
            JSON.parse(content);
        } catch (error) {
            this.logger.error('JSON 格式化失败');
            return;
        }
        const formatted = prettier.format(content, {
            parser: 'json',
        });
        clipboardy.writeSync(formatted);
        this.logger.success('JSON 格式化成功');
    }
}
