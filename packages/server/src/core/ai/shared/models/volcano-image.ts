import BaseModel from './base';

/**
 * 火山方舟大模型图像识别
 */
export default class VolcanoImageModel extends BaseModel {
    /**
     * 构造函数
     * @param apiKey API密钥
     */
    constructor(apiKey: string) {
        super({
            title: '火山方舟大模型图像识别',
            apiKey,
            baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'doubao-1-5-vision-pro-32k-250115',
            type: 'image',
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
