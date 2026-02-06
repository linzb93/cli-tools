import { readSecret } from '@cli-tools/shared/utils/secret';
import { AIModel } from './base';

/**
 * 创建火山方舟大模型Deepseek-v3实例
 */
export const createVolcanoTextModel = async (): Promise<AIModel> => {
    const apiKey = await readSecret((db) => db.ai.apiKey.volcanoDeepseekV3);

    return {
        title: '火山方舟大模型Deepseek-v3',
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        model: 'deepseek-v3-250324',
        type: 'text',
        apiKey,
        errorHandler: (errorMessage: string): string => errorMessage,
    };
};
