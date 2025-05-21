import BaseModel from './base';

/**
 * 火山方舟大模型图像识别
 */
export default class VolcanoImageModel extends BaseModel {
    /**
     * 模型标题
     */
    title = '火山方舟大模型图像识别';

    /**
     * API基础URL
     */
    baseURL = 'https://ark.cn-beijing.volces.com/api/v3';

    /**
     * 模型标识符
     */
    model = 'doubao-1-5-vision-pro-32k-250115';

    /**
     * 模型类型
     */
    type = 'image';

    /**
     * 构造函数
     * @param apiKey API密钥
     */
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
        return errorMessage;
    }
}
