import { fetchService } from '@/business/fetch/service';

export interface FetchCommandOptions {
    clipboard?: boolean;
    method?: 'post' | 'get';
}

export const fetchCommand = (url: string, data: string | undefined, options: FetchCommandOptions) => {
    return fetchService({
        url,
        data,
        clipboard: options.clipboard,
        method: options.method,
    });
};
