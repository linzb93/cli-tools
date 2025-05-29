import OCC from '@/core/occ';
import { Options } from '@/core/occ/types';

export default (input: string[], options: Options) => {
    new OCC().main(input, options);
};
