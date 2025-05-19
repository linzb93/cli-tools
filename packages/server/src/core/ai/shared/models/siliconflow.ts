import BaseModel from './base';

/**
 * Siliconflow模型
 */
export default class SiliconflowModel extends BaseModel {
    /**
     * 构造函数
     * @param apiKey API密钥
     */
    constructor(apiKey: string) {
        super({
            title: 'siliconflow',
            apiKey,
            baseURL: 'https://api.siliconflow.cn',
            model: 'deepseek-ai/DeepSeek-V3',
            type: 'text',
        });
    }

    /**
     * 错误处理方法
     * @param errorMessage 错误信息
     * @returns 处理后的错误信息
     */
    errorHandler(errorMessage: string): string {
        return errorMessage;
    }
}
