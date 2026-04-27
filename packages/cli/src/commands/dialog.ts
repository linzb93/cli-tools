import { showMessageDialog } from '@/utils/dialog';

export const dialogCommand = async (message: string, title?: string): Promise<void> => {
    await showMessageDialog(title || '温馨提醒', message);
};
