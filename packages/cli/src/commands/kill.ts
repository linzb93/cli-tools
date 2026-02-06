import { killService, Params } from '@cli-tools/shared/business/kill';

export const killCommand = async (args: Params) => {
    await killService(...args);
};
