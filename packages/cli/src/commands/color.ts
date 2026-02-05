import { ColorService, Options } from '@cli-tools/shared/business/color';

export const colorCommand = function (text: string, options: Options) {
    new ColorService().main(text, options);
};
