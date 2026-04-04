import { minimaxService, Options } from '@/business/minimax';

export const minimaxCommand = async (options?: Options): Promise<void> => {
    await minimaxService(options);
};
