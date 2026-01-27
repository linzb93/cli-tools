import { CurlService, Options } from '@cli-tools/shared/src/business/curl';

export const curlCommand = (options: Options) => {
    return new CurlService().main(options);
};
