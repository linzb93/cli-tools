import Cookie, { Options } from '@/core/cookie';

export default (data: string, options: Options) => {
    new Cookie().main(data, options);
};
