import BaseModel from './base';

/**
 * DeepSeek模型
 */
export default class DeepseekModel extends BaseModel {
    /**
     * 构造函数
     * @param apiKey API密钥
     */
    constructor(apiKey: string) {
        super({
            title: 'DeepSeek',
            apiKey,
            baseURL: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            type: 'text',
        });
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
