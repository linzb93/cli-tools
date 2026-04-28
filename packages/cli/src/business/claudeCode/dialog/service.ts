import { showMessageDialog } from '@/utils/dialog';
import type { Options } from './types';

/**
 * 显示消息弹窗
 * @param message - 消息内容
 * @param title - 弹窗标题
 */
export const dialogService = async (message: string, options: Options): Promise<void> => {
    await showMessageDialog(options.title || '温馨提醒', message);
};
