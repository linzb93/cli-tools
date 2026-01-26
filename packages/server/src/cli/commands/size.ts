import Size, { Options } from '@/core/size';

export const sizeCommand = (filePath: string, options: Options) => {
    new Size().main(filePath, options);
};
