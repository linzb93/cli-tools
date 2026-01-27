import { KillManager, Params } from '@cli-tools/shared/src/core/kill';

export const killCommand = (args: Params) => {
    new KillManager().main(...args);
};
