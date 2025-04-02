import Resize, { Options } from '@/service/resize';

export default (options: Options) => {
    return new Resize().main(options);
};
