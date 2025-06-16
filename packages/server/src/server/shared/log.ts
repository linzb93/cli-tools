const map = [];
export const log = (content: string) => {
    map.push({
        type: 'message',
        message: content,
    });
};
export const run = () => {
    for (const item of map) {
        process.send?.(item);
    }
};
