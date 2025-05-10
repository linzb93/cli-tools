import Size, { Options } from '@/core/size';

export default (filePath: string, options: Options) => {
    new Size().main(filePath, options);
};
