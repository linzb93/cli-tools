import { OccService } from '@cli-tools/shared/src/business/occ';
import { Options } from '@cli-tools/shared/src/business/occ/types';

export const occCommand = (input: string[], options: Options) => {
    return new OccService().main(input, options);
};
