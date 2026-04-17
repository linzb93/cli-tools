import chalk from 'chalk';
import Module, { IFileAnalysis } from './Module';
import { filterCommentLines } from './commentFilter';

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
        const roughLines = nonEmptyLines.length;

        // 如果没有超出警告范围，直接返回
        if (roughLines <= this.maxLength.warning) {
            const excludedLines = splitLines.length - roughLines;
            return { lines: roughLines, excludedLines };
        }

        // 超出了范围，过滤注释后重新计算
        const filteredLines = filterCommentLines(nonEmptyLines);
        const excludedLines = splitLines.length - filteredLines.length;
        return { lines: filteredLines.length, excludedLines };
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
