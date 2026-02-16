import { translateService, Options } from '@/business/translate';
export const engCommand = (text: string, options: Options) => {
    translateService(text, options);
};
