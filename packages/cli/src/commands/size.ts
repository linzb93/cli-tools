import { SizeService, Options } from '@cli-tools/shared/business/size';

export const sizeCommand = (filePath: string, options: Options) => {
    new SizeService().main(filePath, options);
};
