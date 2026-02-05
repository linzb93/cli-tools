import { readSecret } from '@cli-tools/shared/src/utils/secret';
import BaseModel from './base';

/**
 * Siliconflow模型
 */
export default class SiliconflowModel extends BaseModel {
    /**
     * 模型标题
     */
    title = 'siliconflow';

    /**
     * API基础URL
     */
    baseURL = 'https://api.siliconflow.cn';

    /**
     * 模型标识符
     */
    model = 'deepseek-ai/DeepSeek-V3';

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
        this.apiKey = await readSecret((db) => db.ai.apiKey.siliconflow);
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
