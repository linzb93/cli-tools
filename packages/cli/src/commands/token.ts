import { TokenManager, Options } from '@cli-tools/shared/src/core/token';

export const tokenCommand = (data: string, options: Options) => {
    return new TokenManager().main(data, options);
};
