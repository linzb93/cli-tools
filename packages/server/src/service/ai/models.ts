import sql from '@/common/sql';
export default async (type: string) => {
    const apiKey = await sql((db) => db.ai.apiKey);
    const models = [
        {
            title: '火山方舟大模型Deepseek-v3',
            apiKey: apiKey.volcanoDeepseekV3,
            baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'deepseek-v3-250324',
            type: 'text',
            errorHandler(errorMessage: string) {
                return errorMessage;
            },
        },
        {
            title: 'siliconflow',
            apiKey: apiKey.siliconflow,
            baseURL: 'https://api.siliconflow.cn',
            model: 'deepseek-ai/DeepSeek-V3',
            type: 'text',
            errorHandler(errorMessage: string) {
                return errorMessage;
            },
        },
        {
            title: 'DeepSeek',
            apiKey: apiKey.deepseek,
            baseURL: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            type: 'text',
            errorHandler(errorMessage: string) {
                if (errorMessage.includes('Insufficient Balance')) {
                    return 'DeepSeek余额不足';
                }
                return errorMessage;
            },
        },
        {
            title: '火山方舟大模型图像识别',
            apiKey: apiKey.volcano,
            baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
            model: 'doubao-1-5-vision-pro-32k-250115',
            type: 'image',
            errorHandler(errorMessage: string) {
                return errorMessage;
            },
        },
    ];
    return models.filter((model) => model.type === type);
};
