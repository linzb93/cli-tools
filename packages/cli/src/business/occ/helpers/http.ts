import { readSecret } from '@cli-tools/shared/node';

export const getPrefix = async (isTest: boolean) => {
    return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
};
