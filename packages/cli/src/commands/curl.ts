import { curlService, Options } from '@cli-tools/shared/business/curl';

export const curlCommand = (options: Options) => {
    return curlService(options);
};
