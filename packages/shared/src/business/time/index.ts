import dayjs from 'dayjs';
import BaseService from '../core/BaseService.abstract';

export class TimeService extends BaseService {
    main(timeParam: string): void {
        const time = this.get(timeParam);
        console.log(time);
    }
    get(timeParam: string | number) {
        const time = timeParam.toString();
        if ((time.length !== 10 && time.length !== 13) || !/^\d+$/.test(time)) {
            this.logger.error('请输入正确的时间戳格式，支持10位数字（秒）或13位数字（毫秒）', true);
            return '';
        }
        return dayjs(Number(time) * (time.length === 10 ? 1000 : 1)).format('YYYY-MM-DD HH:mm:ss');
    }
}
