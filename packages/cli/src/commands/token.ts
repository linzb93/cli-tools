import { token, Options } from '@cli-tools/shared/business/token';

export const tokenCommand = (data: string, options: Options) => {
    return token(data, options);
};
