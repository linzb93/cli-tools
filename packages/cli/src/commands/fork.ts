import { forkService } from '@cli-tools/shared/business/fork';

export const forkCommand = (filename: string) => {
    forkService(filename);
};
