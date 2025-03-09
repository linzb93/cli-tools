import Open, { Options } from '@/service/open';

export default (name: string, options: Options) => {
    new Open().main(name, options);
};
