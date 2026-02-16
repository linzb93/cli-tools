import { occService } from '@/business/occ';
import { Options } from '@/business/occ/types';

export const occCommand = (input: string[], options: Options) => {
    return occService(input, options);
};
