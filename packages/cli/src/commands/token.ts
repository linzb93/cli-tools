import { TokenService, Options } from '@cli-tools/shared/src/business/token';

export const tokenCommand = (data: string, options: Options) => {
    return new TokenService().main(data, options);
};
