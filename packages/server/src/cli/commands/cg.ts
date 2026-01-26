import { CgManager, Options } from '@/core/cg';

export const cgCommand = (action: string, data: string, options?: Options) => {
    return new CgManager().main(action, data, options);
};
