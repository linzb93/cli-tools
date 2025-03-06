import OCC, { Options } from '@/service/occ';

export default (input: string[], options: Options) => {
    new OCC().main(input, options);
};
