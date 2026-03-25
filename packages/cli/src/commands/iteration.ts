import { iterationService, type IterationOptions } from '@/business/iteration';

export const iterationCommand = (options: IterationOptions) => {
    iterationService(options);
};
