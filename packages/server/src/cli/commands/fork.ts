import { ForkManager } from '@/core/fork';

export const forkCommand = (filename: string) => {
    new ForkManager().main(filename);
};
