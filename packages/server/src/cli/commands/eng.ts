import { TranslateManager, Options } from '@/core/eng';
export const engCommand = (text: string, options: Options) => {
    new TranslateManager().main(text, options);
};
