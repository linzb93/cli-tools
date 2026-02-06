import { sizeService, Options } from '@cli-tools/shared/business/size';

export const sizeCommand = (filePath: string, options: Options) => {
    sizeService(filePath, options);
};
