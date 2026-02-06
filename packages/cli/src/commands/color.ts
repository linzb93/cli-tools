import { colorService, Options } from '@cli-tools/shared/business/color';

export const colorCommand = function (text: string, options: Options) {
    colorService(text, options);
};
