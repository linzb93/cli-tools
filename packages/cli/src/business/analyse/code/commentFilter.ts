/**
 * 过滤掉空行、独立注释行和多行注释
 * @param lines 文件行数组
 * @returns 过滤后的有效代码行
 */
export const filterCommentLines = (lines: string[]): string[] => {
    const result: string[] = [];
    let inBlockComment = false;
    let inHtmlComment = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // 跳过空行
        if (trimmed === '') continue;

        // 单行注释
        if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

        // HTML 注释（Vue template 中）
        if (trimmed.startsWith('<!--')) {
            inHtmlComment = true;
            if (trimmed.includes('-->')) {
                inHtmlComment = false;
            }
            continue;
        }

        if (inHtmlComment) {
            if (trimmed.includes('-->')) {
                inHtmlComment = false;
            }
            continue;
        }

        // 多行注释开始/结束
        if (trimmed.startsWith('/*')) {
            inBlockComment = true;
            if (trimmed.includes('*/')) {
                inBlockComment = false;
            }
            continue;
        }

        if (inBlockComment) {
            if (trimmed.includes('*/')) {
                inBlockComment = false;
            }
            continue;
        }

        result.push(line);
    }

    return result;
};
