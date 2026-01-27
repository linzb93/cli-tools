import { ColorManager, Options } from '@cli-tools/shared/src/core/color';

export const colorCommand = function (text: string, options: Options) {
    new ColorManager().main(text, options);
};
