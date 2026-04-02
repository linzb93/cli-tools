import { curlService } from '@/business/curl';
import type { Options } from '@/business/curl';

export const curlCommand = (options: Options) => {
    return curlService(options);
};
