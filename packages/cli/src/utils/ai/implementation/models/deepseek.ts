import { readSecret } from '@cli-tools/shared/node';
import { handleAIError } from '@cli-tools/shared';
import { AIModel } from './base';
import type { AiModelSchema } from './types';

/**
 * 创建DeepSeek模型实例
 */
export const createDeepseekModel = async (): Promise<AIModel> => {
    const apiKey = await readSecret<string, AiModelSchema>((db) => db.ai.apiKey.deepseek);

    return {
        title: 'DeepSeek',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        type: 'text',
        apiKey,
        errorHandler: (errorMessage: string): string => handleAIError(errorMessage, 'DeepSeek'),
    };
};
