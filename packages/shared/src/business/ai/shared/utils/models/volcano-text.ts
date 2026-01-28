import { readSecret } from '../../../../../utils/secret';
import BaseModel from './base';

/**
 * 火山方舟大模型Deepseek-v3
 */
export default class VolcanoTextModel extends BaseModel {
    /**
     * 模型标题
     */
    title = '火山方舟大模型Deepseek-v3';

    /**
     * API基础URL
     */
    baseURL = 'https://ark.cn-beijing.volces.com/api/v3';

    /**
     * 模型标识符
     */
    model = 'deepseek-v3-250324';

    /**
     * 模型类型
     */
    type = 'text';

    /**
     * 构造函数
     */
    constructor() {
        super();
        this.init();
    }

    async init() {
        this.apiKey = await readSecret((db) => db.ai.apiKey.volcanoDeepseekV3);
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
