import Ai, { Options } from '@/service/ai';

export default (data: string, options: Options) => {
    new Ai().main(data, options);
};
