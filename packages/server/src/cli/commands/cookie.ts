import { CookieManager, Options } from '@/core/cookie';
export const cookieCommand = (data: string, options: Options) => {
    new CookieManager().main(data, options);
};
