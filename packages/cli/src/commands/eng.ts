import { TranslateService, Options } from '@cli-tools/shared/business/translate';
export const engCommand = (text: string, options: Options) => {
    new TranslateService().main(text, options);
};
