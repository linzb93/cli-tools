import fs from 'fs-extra';
import chalk from 'chalk';
import Module, { IFileAnalysis } from './Module';

/**
 * Vue文件分析模块
 */
export default class VueModule extends Module {
    /**
     * 最大长度配置
     */
    maxLength = {
        warning: 500,
        danger: 700,
    };

    /**
     * 检测是否应该使用该模块
     * @returns 是否应该使用该模块
     */
    async access(): Promise<boolean> {
        try {
            await fs.access('vue.config.js');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取需要分析的文件模式
     * @param prefix 前缀
     * @returns 文件模式
     */
    filePattern(prefix: string): string {
        return `${prefix ? `${prefix}/` : ''}**/*.vue`;
    }

    /**
     * 计算文件分析结果
     * @param splitLines 文件行内容
     * @returns 分析结果
     */
    calc(splitLines: string[]) {
        // 过滤空行
        const nonEmptyLines = splitLines.filter((line) => line.trim() !== '');

        // 如果总行数没有达到警告级别，直接返回 0
        if (nonEmptyLines.length <= this.maxLength.warning) {
            return {
                lines: nonEmptyLines.length,
                scriptLength: 0,
                templateLength: 0,
                styleLength: 0,
            };
        }

        // 找出所有 style 标签的起始和结束位置
        const styleStartIndexes = nonEmptyLines
            .map((line, index) => (line.includes('<style') ? index : -1))
            .filter((index) => index !== -1);

        const styleEndIndexes = nonEmptyLines
            .map((line, index) => (line.includes('</style>') ? index : -1))
            .filter((index) => index !== -1);

        // 查找 script 标签
        const scriptStart = nonEmptyLines.findIndex((line) => line.includes('<script'));
        const scriptEnd = nonEmptyLines.findIndex((line) => line.includes('</script>'));

        // 计算 script 标签内的行数
        const scriptLength = scriptStart !== -1 && scriptEnd !== -1 ? scriptEnd - scriptStart - 1 : 0;

        // 正确处理 template 标签，考虑嵌套情况
        let templateLength = 0;
        let inTemplate = false;
        let templateDepth = 0;
        let templateStartIndex = -1;

        // 检查是否存在 template 标签
        const hasTemplateStart = nonEmptyLines.some((line) => line.includes('<template'));
        const hasTemplateEnd = nonEmptyLines.some((line) => line.includes('</template>'));

        // 如果没有完整的 template 标签对，尝试估算 template 部分
        if (!hasTemplateStart || !hasTemplateEnd) {
            // 如果文件中没有 script 和 style 标签，则所有内容都视为 template
            if (scriptStart === -1 && styleStartIndexes.length === 0) {
                templateLength = nonEmptyLines.length;
            } else {
                // 估算：总行数减去 script 和 style 的行数
                let nonTemplateLines = scriptLength;
                if (scriptStart !== -1) nonTemplateLines += 2; // script 标签本身

                // 添加所有 style 标签的行数
                for (let i = 0; i < styleStartIndexes.length; i++) {
                    const start = styleStartIndexes[i];
                    const end = styleEndIndexes[i];
                    if (start !== undefined && end !== undefined) {
                        nonTemplateLines += end - start + 1;
                    }
                }

                templateLength = nonEmptyLines.length - nonTemplateLines;
                templateLength = Math.max(0, templateLength); // 确保不是负数
            }
        } else {
            // 按照嵌套逻辑计算 template 行数
            for (let i = 0; i < nonEmptyLines.length; i++) {
                const line = nonEmptyLines[i];

                // 检测 template 开始标签
                if (line.includes('<template')) {
                    if (!inTemplate) {
                        inTemplate = true;
                        templateStartIndex = i;
                    }
                    templateDepth++;
                }

                // 检测 template 结束标签
                if (line.includes('</template>')) {
                    templateDepth--;

                    // 当所有嵌套的 template 都结束时，计算总行数
                    if (templateDepth === 0 && inTemplate) {
                        // 修正计算方式：包括开始和结束行之间的所有行
                        const blockLength = i - templateStartIndex - 1;
                        templateLength += Math.max(0, blockLength);
                        inTemplate = false;
                    }
                }
            }

            // 如果计算结果为 0 但存在 template 标签，可能是计算有误
            if (templateLength === 0 && hasTemplateStart && hasTemplateEnd) {
                // 寻找第一个 template 开始和最后一个 template 结束
                const firstTemplateStart = nonEmptyLines.findIndex((line) => line.includes('<template'));
                const lastTemplateEnd =
                    nonEmptyLines.length -
                    1 -
                    [...nonEmptyLines].reverse().findIndex((line) => line.includes('</template>'));

                if (firstTemplateStart !== -1 && lastTemplateEnd !== -1 && firstTemplateStart < lastTemplateEnd) {
                    templateLength = lastTemplateEnd - firstTemplateStart - 1;
                }
            }
        }

        // 计算所有 style 标签内的总行数
        let styleLength = 0;
        for (let i = 0; i < styleStartIndexes.length; i++) {
            const start = styleStartIndexes[i];
            const end = styleEndIndexes[i];
            if (start !== undefined && end !== undefined) {
                styleLength += end - start - 1;
            }
        }

        return {
            lines: nonEmptyLines.length,
            scriptLength,
            templateLength,
            styleLength,
        };
    }

    /**
     * 渲染配置
     */
    render = [
        {
            name: '文件地址',
            data: (row: IFileAnalysis) => chalk.cyan(row.file),
        },
        {
            name: '总行数',
            data: (row: IFileAnalysis) => chalk.cyan(row.lines),
        },
        {
            name: '代码分布',
            data: (row: IFileAnalysis) =>
                chalk.cyan(`template:${row.templateLength}行;script:${row.scriptLength}行;style:${row.styleLength}行`),
        },
    ];
}
