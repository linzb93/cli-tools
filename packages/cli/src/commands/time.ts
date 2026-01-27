import { TimeService } from '@cli-tools/shared/src/business/time';

export const timeCommand = function (timeParam: string) {
    new TimeService().main(timeParam);
};
