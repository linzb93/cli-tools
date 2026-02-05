import { OccService } from '@cli-tools/shared/business/occ';
import { Options } from '@cli-tools/shared/business/occ/types';

export const occCommand = (input: string[], options: Options) => {
    return new OccService().main(input, options);
};
