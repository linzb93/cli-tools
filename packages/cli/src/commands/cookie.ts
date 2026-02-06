import { cookieService, Options } from '@cli-tools/shared/business/cookie';
export const cookieCommand = (data: string, options: Options) => {
    return cookieService(data, options);
};
