import rawOpen from 'open';
import { sleep } from '@linzb93/utils';

/**
 * 判断是否为URL
 * @param text 输入文本
 * @returns 是否为URL
 */
export const isUrl = (text: string): boolean => {
    return /^(http|https):\/\/[^ "]+$/.test(text);
};

/**
 * 打开URL
 * @param url 要打开的URL
 * @returns {Promise<void>}
 */
export const open = async (url: string): Promise<void> => {
    await Promise.race([rawOpen(url, { wait: true }), sleep(5000)]);
};
