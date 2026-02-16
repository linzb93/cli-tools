import { curlService, Options } from '@/business/curl';

export const curlCommand = (options: Options) => {
    return curlService(options);
};
