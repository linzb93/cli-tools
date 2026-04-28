import clipboardy from 'clipboardy';

/**
 * 获取剪贴板内容
 * @returns 剪贴板文本
 */
export const getClipboardContent = (): string => {
    try {
        return clipboardy.readSync();
    } catch (error) {
        console.error('读取剪贴板失败:', error);
        return '';
    }
};
