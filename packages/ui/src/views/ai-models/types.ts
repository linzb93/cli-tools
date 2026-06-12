export interface PlatformConfig {
  label: string;
  value: string;
  urls: Record<string, string>;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    label: 'OpenAI',
    value: 'openai',
    urls: { openai: 'https://api.openai.com/v1', anthropic: '' }
  },
  {
    label: 'Anthropic',
    value: 'anthropic',
    urls: { openai: '', anthropic: 'https://api.anthropic.com' }
  },
  {
    label: 'Deepseek',
    value: 'deepseek',
    urls: { openai: 'https://api.deepseek.com', anthropic: '' }
  },
  {
    label: 'Minimax',
    value: 'minimax',
    urls: { openai: 'https://api.minimax.chat/v1', anthropic: '' }
  },
  { label: '小米 Mimo', value: 'mimo', urls: { openai: 'https://api.mimo.xyz/v1', anthropic: '' } },
  {
    label: '硅基流动',
    value: 'siliconflow',
    urls: { openai: 'https://api.siliconflow.cn/v1', anthropic: '' }
  },
  { label: '自定义', value: 'custom', urls: { openai: '', anthropic: '' } }
];

export const INTERFACE_FORMAT_OPTIONS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' }
];

export const INTERFACE_FORMAT_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com'
};

export const MEDIA_TYPE_OPTIONS = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' }
];
