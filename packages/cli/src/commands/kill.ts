import { KillService, Params } from '@cli-tools/shared/src/business/kill';

export const killCommand = (args: Params) => {
    new KillService().main(...args);
};
