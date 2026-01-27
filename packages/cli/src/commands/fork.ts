import { ForkManager } from '@cli-tools/shared/src/core/fork';

export const forkCommand = (filename: string) => {
    new ForkManager().main(filename);
};
