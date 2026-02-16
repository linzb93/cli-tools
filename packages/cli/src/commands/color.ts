import { colorService, Options } from '@/business/color';

export const colorCommand = function (text: string, options: Options) {
    colorService(text, options);
};
