import { timeService } from '@cli-tools/shared/business/time';

export const timeCommand = function (timeParam: string) {
    timeService(timeParam);
};
