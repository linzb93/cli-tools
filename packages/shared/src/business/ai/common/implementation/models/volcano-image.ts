import { readSecret } from '@cli-tools/shared/utils/secret';
import { AIModel } from './base';

/**
 * 创建火山方舟大模型图像识别实例
 */
export const createVolcanoImageModel = async (): Promise<AIModel> => {
    const apiKey = await readSecret((db) => db.ai.apiKey.volcano);

    return {
        title: '火山方舟大模型图像识别',
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        model: 'doubao-1-5-vision-pro-32k-250115',
        type: 'image',
        apiKey,
        errorHandler: (errorMessage: string): string => errorMessage,
    };
};
