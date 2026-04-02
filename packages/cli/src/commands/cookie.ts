import { cookieService } from '@/business/cookie';
import type { Options } from '@/business/cookie';

export const cookieCommand = (data: string, options: Options) => {
    return cookieService(data, options);
};
