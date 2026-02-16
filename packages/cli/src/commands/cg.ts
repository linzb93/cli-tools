import { cgService, Options } from '@/business/cg';

export const cgCommand = (action: string, data: string, options?: Options) => {
    return cgService(action, data, options);
};
