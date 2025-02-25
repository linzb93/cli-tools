import sql from '@/common/sql';
export default async (type: string) => {
    const apiKey = await sql((db) => db.ai.apiKey);
    const models = [
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
            // 输出不稳定，要求只输出单行json格式的，还是会带markdown格式以及换行。
            title: 'siliconflow图像识别',
            apiKey: apiKey.siliconflow,
            baseURL: 'https://api.siliconflow.cn',
            model: 'Qwen/Qwen2-VL-72B-Instruct',
            type: 'image',
            errorHandler(errorMessage: string) {
                return errorMessage;
            },
        },
    ];
    return models.filter((model) => model.type === type);
};
