/**
 * 翻译模块类型定义
 */

export interface Options {
    /**
     * 是否使用AI翻译
     * @default false
     */
    ai: boolean;
    /**
     * 是否读取剪贴板
     * @default false
     */
    clipboard?: boolean;
}
