import rawOpen from 'open';
import { timeout } from 'es-toolkit';
import { isWin } from '@cli-tools/shared';
import { execa } from 'execa';
/**
 * 判断是否为URL
 * @param text 输入文本
 * @returns 是否为URL
 */
export const isURL = (text: string): boolean => {
    return /^(http|https):\/\/[^ "]+$/.test(text);
};

/**
 * 打开URL
 * @param url 要打开的URL
 * @returns {Promise<void>}
 */
export const open = async (url: string): Promise<void> => {
    if (url.startsWith('http')) {
        await Promise.race([rawOpen(url, { wait: true }), timeout(5000)]);
    } else {
        try {
            if (isWin) {
                await execa('explorer', [url], {
                    shell: true,
                });
            } else {
                await rawOpen(url, { wait: true });
            }
        } catch {
            // 忽略错误
        }
    }
};
