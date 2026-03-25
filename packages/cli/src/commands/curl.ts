import { curlService } from '@/business/curl/service';
import type { Options } from '@/business/curl/types';

export const curlCommand = (options: Options) => {
    return curlService(options);
};
