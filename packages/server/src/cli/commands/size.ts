import { SizeManager, Options } from '@/core/size';

export const sizeCommand = (filePath: string, options: Options) => {
    new SizeManager().main(filePath, options);
};
