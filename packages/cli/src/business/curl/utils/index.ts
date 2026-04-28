/**
 * 解析curl命令中的HTTP方法
 * @param lines curl命令的所有行
 * @returns HTTP方法，默认为'get'
 */
export const parseMethod = (lines: string[]): string => {
    const methodLine = lines.find((line) => {
        return line.trim().startsWith('-X') || line.trim().startsWith('--request');
    });

    if (methodLine) {
        const match = methodLine.match(/-(?:X|\-request)\s+(\w+)/);
        return match ? match[1].toLowerCase() : 'get';
    }

    // 如果有数据体，默认为POST
    const hasData = lines.some((line) => {
        return (
            line.trim().startsWith('--data-raw') || line.trim().startsWith('--data') || line.trim().startsWith('-d')
        );
    });

    return hasData ? 'post' : 'get';
};
