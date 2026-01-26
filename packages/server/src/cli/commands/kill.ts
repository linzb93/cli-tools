import { KillManager, Params } from '@/core/kill';

export const killCommand = (args: Params) => {
    new KillManager().main(...args);
};
