import Open, { Options } from '@/core/open';

export default (name: string, options: Options) => {
    new Open().main(name, options);
};
