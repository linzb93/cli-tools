import { forkService } from '@/business/fork';
import type { Options } from '@/business/fork';
export const forkCommand = (filename: string, options: Options) => {
    forkService(filename, options);
};
