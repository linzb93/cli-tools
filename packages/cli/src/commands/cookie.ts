import { CookieService, Options } from '@cli-tools/shared/src/business/cookie';
export const cookieCommand = (data: string, options: Options) => {
    new CookieService().main(data, options);
};
