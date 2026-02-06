import { occService } from '@cli-tools/shared/business/occ';
import { Options } from '@cli-tools/shared/business/occ/types';

export const occCommand = (input: string[], options: Options) => {
    return occService(input, options);
};
