import Token, { Options } from '@/core/token';

export default (data: string, options: Options) => {
    return new Token().main(data, options);
};
