import { ColorManager, Options } from '@/core/color';

export const colorCommand = function (text: string, options: Options) {
    new ColorManager().main(text, options);
};
