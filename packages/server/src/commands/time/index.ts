import dayjs from "dayjs";
import logger from "@/util/logger";
interface Options {
    silent: boolean
}

export default function (timeParam:string, options?: Options): string {
    const time = timeParam.toString();
    if (time.length !== 10 && time.length !== 13 || !/^\d+$/.test(time)) {
        if (!options?.silent) {
            logger.error('请输入正确的时间戳格式');
        }
        return '';
    }
    const targetDayjs = time.length === 10 ? dayjs(Number(time) * 1000) : dayjs(Number(time));
    const outputFormat = targetDayjs.format('YYYY-MM-DD HH:mm:ss');
    return outputFormat;
}