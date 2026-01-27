import { OccManager } from '@cli-tools/shared/src/core/occ';
import { Options } from '@cli-tools/shared/src/core/occ/types';

export const occCommand = (input: string[], options: Options) => {
    new OccManager().main(input, options);
};
