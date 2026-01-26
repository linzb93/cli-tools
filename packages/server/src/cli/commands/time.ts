import { TimeManager } from '@/core/time';

export const timeCommand = function (timeParam: string) {
    new TimeManager().main(timeParam);
};
