import { timeService } from '@/business/time';

export const timeCommand = function (timeParam: string) {
    timeService(timeParam);
};
