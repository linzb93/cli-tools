import { killService, Params } from '@/business/kill';

export const killCommand = async (args: Params) => {
    await killService(...args);
};
