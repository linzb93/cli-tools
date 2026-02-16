import { forkService } from '@/business/fork';

export const forkCommand = (filename: string) => {
    forkService(filename);
};
