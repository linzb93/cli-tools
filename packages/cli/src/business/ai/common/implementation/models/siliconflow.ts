import { readSecret } from '@cli-tools/shared/utils/secret';
import { AIModel } from './base';

/**
 * 创建Siliconflow模型实例
 */
export const createSiliconflowModel = async (): Promise<AIModel> => {
    const apiKey = await readSecret((db) => db.ai.apiKey.siliconflow);

    return {
        title: 'siliconflow',
        baseURL: 'https://api.siliconflow.cn',
        model: 'deepseek-ai/DeepSeek-V3',
        type: 'text',
        apiKey,
        errorHandler: (errorMessage: string): string => errorMessage,
    };
};
