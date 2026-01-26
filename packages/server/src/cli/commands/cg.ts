import Cg, { Options } from '@/core/cg';

export const cgCommand = (action: string, data: string, options?: Options) => {
    return new Cg().main(action, data, options);
};
