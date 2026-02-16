import chalk from 'chalk';
import Module, { IFileAnalysis } from './Module';

/**
 * JavaScript文件分析模块
 */
export const javascriptModule: Module = {
    /**
     * 最大长度配置
     */
    maxLength: {
        warning: 300,
        danger: 500,
    },

    /**
     * 检测是否应该使用该模块
     * @returns 是否应该使用该模块
     */
    async access(): Promise<boolean> {
        return true;
    },

    /**
     * 获取需要分析的文件模式
     * @param prefix 前缀
     * @returns 文件模式
     */
    filePattern(prefix: string): string {
        return `${prefix ? `${prefix}/` : ''}**/*.{js,ts}`;
    },

    /**
     * 计算文件分析结果
     * @param splitLines 文件行内容
     * @returns 分析结果
     */
    calc(splitLines: string[]) {
        // 过滤空行
        const nonEmptyLines = splitLines.filter((line) => line.trim() !== '');
        return {
            lines: nonEmptyLines.length,
        };
    },

    /**
     * 渲染配置
     */
    render: [
        {
            name: '文件地址',
            data: (row: IFileAnalysis) => chalk.cyan(row.file),
        },
        {
            name: '行数',
            data: (row: IFileAnalysis) => chalk.cyan(row.lines),
        },
    ],
};
