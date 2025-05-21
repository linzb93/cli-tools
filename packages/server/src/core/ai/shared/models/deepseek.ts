import BaseModel from './base';

/**
 * DeepSeek模型
 */
export default class DeepseekModel extends BaseModel {
    /**
     * 模型标题
     */
    title = 'DeepSeek';

    /**
     * API基础URL
     */
    baseURL = 'https://api.deepseek.com';

    /**
     * 模型标识符
     */
    model = 'deepseek-chat';

    /**
     * 模型类型
     */
    type = 'text';
    constructor(apiKey: string) {
        super();
        this.apiKey = apiKey;
    }

    /**
     * 错误处理方法
     * @param errorMessage 错误信息
     * @returns 处理后的错误信息
     */
    errorHandler(errorMessage: string): string {
        if (errorMessage.includes('Insufficient Balance')) {
            return 'DeepSeek余额不足';
        }
        return errorMessage;
    }
}
