import { sizeService, Options } from '@/business/size';

export const sizeCommand = (filePath: string, options: Options) => {
    sizeService(filePath, options);
};
