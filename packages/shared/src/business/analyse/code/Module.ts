/**
 * 文件分析结果接口
 */
export interface IFileAnalysis {
    lines: number;
    scriptLength?: number;
    templateLength?: number;
    styleLength?: number;
    file: string;
    type: 'normal' | 'warning' | 'danger';
}

/**
 * 分析模块接口
 */
export default interface Module {
    /**
     * 最大长度配置
     */
    maxLength: {
        warning: number;
        danger: number;
    };

    /**
     * 检测是否应该使用该模块
     * @returns 是否应该使用该模块
     */
    access(): Promise<boolean>;

    /**
     * 获取需要分析的文件模式
     * @param prefix 前缀
     * @returns 文件模式
     */
    filePattern(prefix: string): string;

    /**
     * 计算文件分析结果
     * @param lines 文件行内容
     * @returns 分析结果
     */
    calc(lines: string[]): {
        lines: number;
        scriptLength?: number;
        templateLength?: number;
        styleLength?: number;
    };

    /**
     * 渲染配置
     */
    render: {
        name: string;
        data(row: IFileAnalysis): string;
    }[];
}
