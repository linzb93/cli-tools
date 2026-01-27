import { TimeManager } from '@cli-tools/shared/src/core/time';

export const timeCommand = function (timeParam: string) {
    new TimeManager().main(timeParam);
};
