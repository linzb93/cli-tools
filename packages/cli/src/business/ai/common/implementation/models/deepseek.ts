import { readSecret } from '@cli-tools/shared/utils/secret';
import { AIModel } from './base';

/**
 * 创建DeepSeek模型实例
 */
export const createDeepseekModel = async (): Promise<AIModel> => {
    const apiKey = await readSecret((db) => db.ai.apiKey.deepseek);

    return {
        title: 'DeepSeek',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        type: 'text',
        apiKey,
        errorHandler: (errorMessage: string): string => {
            if (errorMessage.includes('Insufficient Balance')) {
                return 'DeepSeek余额不足';
            }
            return errorMessage;
        },
    };
};
