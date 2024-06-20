import dayjs from "dayjs";
import logger from "@/util/logger";
interface Options {
    silent: boolean
}

export default function (time:string, options?: Options): string {
    if (time.length !== 10 && time.length !== 13 || !/^\d+$/.test(time)) {
        logger.error('请输入正确的时间戳格式');
        return '不正确的时间戳格式';
    }
    const targetDayjs = time.length === 10 ? dayjs(Number(time) * 1000) : dayjs(Number(time));
    const outputFormat = targetDayjs.format('YYYY-MM-DD HH:mm:ss');
    if (!options?.silent) {
        console.log(outputFormat);
        return '';
    }
    return outputFormat;
}