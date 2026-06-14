import { readSecret } from '@cli-tools/shared/node';
import { handleAIError } from '@cli-tools/shared';
import { AIModel } from './base';
import type { AiModelSchema } from './types';

/**
 * 创建火山方舟大模型图像识别实例
 */
export const createVolcanoImageModel = async (): Promise<AIModel> => {
    const apiKey = await readSecret<string, AiModelSchema>((db) => db.ai.apiKey.volcano);

    return {
        title: '火山方舟大模型图像识别',
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        model: 'doubao-1-5-vision-pro-32k-250115',
        type: 'image',
        apiKey,
        errorHandler: (errorMessage: string): string => handleAIError(errorMessage, '火山方舟图像'),
    };
};
