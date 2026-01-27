import { ForkService } from '@cli-tools/shared/src/business/fork';

export const forkCommand = (filename: string) => {
    new ForkService().main(filename);
};
