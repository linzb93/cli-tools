import sql from '@/common/sql';
export default async () => {
    const apiKey = await sql((db) => db.ai.apiKey);
    return [
        {
            title: 'siliconflow',
            apiKey: apiKey.siliconflow,
            baseURL: 'https://api.siliconflow.cn',
            model: 'deepseek-ai/DeepSeek-V3',
            errorHandler(errorMessage: string) {
                return errorMessage;
            },
        },
        {
            title: 'DeepSeek',
            apiKey: apiKey.deepseek,
            baseURL: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            errorHandler(errorMessage: string) {
                if (errorMessage.includes('Insufficient Balance')) {
                    return 'DeepSeek余额不足';
                }
                return errorMessage;
            },
        },
        {
            title: 'siliconflow图像识别',
            apiKey: apiKey.siliconflow,
            baseURL: 'https://api.siliconflow.cn',
            model: 'Qwen/Qwen2-VL-72B-Instruct',
            errorHandler(errorMessage: string) {
                return errorMessage;
            },
        },
    ];
};
