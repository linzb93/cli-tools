/**
 * cli进度条
 */
let current = 0;
let total = 0;

/**
 * 渲染进度条
 */
function renderProgressBar(percentage: number, width: number = 40): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

export default {
    /**
     * 设置总数并重置进度
     */
    setTotal(newTotal: number) {
        total = newTotal;
        current = 0;
    },
    /**
     * 更新进度
     */
    tick() {
        current++;
        const percentage = Math.round((current / total) * 100);
        const bar = renderProgressBar(percentage);
        process.stdout.write(`\r${bar} ${current}/${total}`);
    },
};
