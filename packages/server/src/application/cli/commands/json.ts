import JSONClass, { type Options } from '@/service/json';

export default (data: string[], options: Options) => {
    new JSONClass().main(data, options);
};
