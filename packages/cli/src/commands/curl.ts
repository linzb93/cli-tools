import { CurlService, Options } from '@cli-tools/shared/business/curl';

export const curlCommand = (options: Options) => {
    return new CurlService().main(options);
};
