import Cookie, { Options } from '@/service/cookie';

export default (data: string, options: Options) => {
    new Cookie().main(data, options);
};
