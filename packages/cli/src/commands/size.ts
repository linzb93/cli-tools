import { SizeManager, Options } from '@cli-tools/shared/src/core/size';

export const sizeCommand = (filePath: string, options: Options) => {
    new SizeManager().main(filePath, options);
};
