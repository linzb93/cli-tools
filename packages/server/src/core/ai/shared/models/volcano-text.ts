import BaseModel from './base';

/**
 * 火山方舟大模型Deepseek-v3
 */
export default class VolcanoTextModel extends BaseModel {
    /**
     * 构造函数
     * @param apiKey API密钥
     */
    constructor(apiKey: string) {
        super({
            title: '火山方舟大模型Deepseek-v3',
            apiKey,
            baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'deepseek-v3-250324',
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
