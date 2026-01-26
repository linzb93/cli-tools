import { TokenManager, Options } from '@/core/token';

export const tokenCommand = (data: string, options: Options) => {
    return new TokenManager().main(data, options);
};
