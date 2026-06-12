interface PlatformConfig {
    label: string;
    value: string;
    urls: Record<string, string>;
}
export const AI_MODELS_PLATFORMS: PlatformConfig[] = [
    {
        label: 'Deepseek',
        value: 'Deepseek',
        urls: { openai: 'https://api.deepseek.com', anthropic: 'https://api.deepseek.com/anthropic' },
    },
    {
        label: 'Minimax',
        value: 'Minimax',
        urls: { openai: 'https://api.minimaxi.com/v1', anthropic: 'https://api.minimaxi.com/anthropic' },
    },
    {
        label: '小米 Mimo',
        value: 'Xiaomi MiMo',
        urls: {
            openai: 'https://api.xiaomimimo.com/v1',
            anthropic: 'https://api.xiaomimimo.com/anthropic',
        },
    },
    {
        label: '硅基流动',
        value: 'siliconflow',
        urls: { openai: 'https://api.siliconflow.cn/v1', anthropic: 'https://api.siliconflow.cn' },
    },
    { label: '自定义', value: 'custom', urls: { openai: '', anthropic: '' } },
];
