import { fetchService } from '@/business/fetch/service';
import type { FetchOptions } from '@/business/fetch/types';

export const fetchCommand = (url: string, data: string | undefined, options: Partial<FetchOptions>) => {
    return fetchService({
        url,
        data,
        clipboard: options.clipboard,
        method: options.method,
    });
};
