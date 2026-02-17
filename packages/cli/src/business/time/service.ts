import dayjs from 'dayjs';
import { logger } from '@/utils/logger';

export const timeService = (timeParam: string): void => {
    logger.info('TimeService main executed');
    const time = getTime(timeParam);
    console.log(time);
};

export const getTime = (timeParam: string | number) => {
    const time = timeParam.toString();
    if ((time.length !== 10 && time.length !== 13) || !/^\d+$/.test(time)) {
        logger.error('请输入正确的时间戳格式，支持10位数字（秒）或13位数字（毫秒）', true);
        return '';
    }
    return dayjs(Number(time) * (time.length === 10 ? 1000 : 1)).format('YYYY-MM-DD HH:mm:ss');
};
