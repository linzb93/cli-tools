import OCC, { Options } from '@/core/occ';

export default (input: string[], options: Options) => {
    new OCC().main(input, options);
};
