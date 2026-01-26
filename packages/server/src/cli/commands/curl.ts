import { CurlManager, Options } from '@/core/curl';

export const curlCommand = (options: Options) => {
    return new CurlManager().main(options);
};
