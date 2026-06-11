export interface AiModel {
  id: string;
  name: string;
  platform: string;
  url: string;
  mediaType: 'text' | 'image';
  apiKey: string;
  interfaceFormat: string[];
  weight: number;
}

export const PLATFORM_OPTIONS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Azure', value: 'azure' },
  { label: '自定义', value: 'custom' },
];

export const PLATFORM_DEFAULT_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  azure: 'https://{resource}.openai.azure.com',
  custom: '',
};

export const INTERFACE_FORMAT_OPTIONS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
];

export const INTERFACE_FORMAT_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
};

export const MEDIA_TYPE_OPTIONS = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
];
