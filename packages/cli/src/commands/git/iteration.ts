import { iterationService, type IterationOptions } from '@/business/git/iteration';

export const iterationCommand = (options: IterationOptions) => {
    iterationService(options);
};
