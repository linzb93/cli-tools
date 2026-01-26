import { OccManager } from '@/core/occ';
import { Options } from '@/core/occ/types';

export const occCommand = (input: string[], options: Options) => {
    new OccManager().main(input, options);
};
