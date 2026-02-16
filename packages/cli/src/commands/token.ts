import { token, Options } from '@/business/token';

export const tokenCommand = (data: string, options: Options) => {
    return token(data, options);
};
