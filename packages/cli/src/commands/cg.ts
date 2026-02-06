import { cgService, Options } from '@cli-tools/shared/business/cg';

export const cgCommand = (action: string, data: string, options?: Options) => {
    return cgService(action, data, options);
};
