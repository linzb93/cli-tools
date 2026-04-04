import { minimaxService } from '@/business/minimax';

export const minimaxCommand = async (command?: string): Promise<void> => {
    await minimaxService(command);
};
