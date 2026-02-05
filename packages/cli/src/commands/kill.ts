import { KillService, Params } from '@cli-tools/shared/business/kill';

export const killCommand = (args: Params) => {
    new KillService().main(...args);
};
