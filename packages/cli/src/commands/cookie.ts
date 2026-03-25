import { cookieService } from '@/business/cookie/service';
import type { Options } from '@/business/cookie/types';
export const cookieCommand = (data: string, options: Options) => {
    return cookieService(data, options);
};
