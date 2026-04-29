/**
 * 时间毫秒格式化
 * @param timeMs 时间毫秒
 * @param options 选项
 * @param options.minUnitIsMinute 最小单位是否为分钟，默认false，即秒为单位单位
 * @returns 格式化后的时间字符串
 */
export const timeRemainsFormat = (
    timeMs: number,
    options?: {
        minUnitIsMinute?: boolean;
    },
) => {
    const { minUnitIsMinute = false } = options || {};
    const timeS = timeMs / 1000;
    if (timeS < 60) {
        if (minUnitIsMinute) {
            return `不到一分钟`;
        }
        return `${timeS.toFixed(2)}秒`;
    }
    const timeM = timeS / 60;
    if (timeM < 60) {
        if (minUnitIsMinute) {
            return `${parseInt(timeM.toString())}分钟`;
        }
        return `${parseInt(timeM.toString())}分钟${parseInt((timeS % 60).toString())}秒`;
    }
    const timeH = timeM / 60;
    if (minUnitIsMinute) {
        return `${parseInt(timeH.toString())}小时${parseInt((timeM % 60).toString())}分钟`;
    }
    return `${parseInt(timeH.toString())}小时${parseInt((timeM % 60).toString())}分钟${parseInt((timeS % 60).toString())}秒`;
};
