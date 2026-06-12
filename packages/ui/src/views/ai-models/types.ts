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
