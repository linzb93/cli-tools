import { ForkService } from '@cli-tools/shared/business/fork';

export const forkCommand = (filename: string) => {
    new ForkService().main(filename);
};
