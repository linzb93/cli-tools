import { translateService, Options } from '@cli-tools/shared/business/translate';
export const engCommand = (text: string, options: Options) => {
    translateService(text, options);
};
