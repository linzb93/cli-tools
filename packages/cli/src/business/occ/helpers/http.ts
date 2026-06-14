import { readSecret } from '@cli-tools/shared/node';
import type { OccSchema } from '../types';

export const getPrefix = async (isTest: boolean) => {
    return await readSecret<string, OccSchema>((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
};
