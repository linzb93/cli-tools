import CurlCommand, { Options } from '@/core/curl';

export default (options: Options) => {
    return new CurlCommand().main(options);
};
