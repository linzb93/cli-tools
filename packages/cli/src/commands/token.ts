import { tokenService, Options } from '@/business/token';

export const tokenCommand = (data: string, options: Options) => {
    return tokenService(data, options);
};
