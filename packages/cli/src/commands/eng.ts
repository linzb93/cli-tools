import { TranslateManager, Options } from '@cli-tools/shared/src/core/eng';
export const engCommand = (text: string, options: Options) => {
    new TranslateManager().main(text, options);
};
