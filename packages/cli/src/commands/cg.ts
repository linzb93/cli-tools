import { CgService, Options } from '@cli-tools/shared/business/cg';

export const cgCommand = (action: string, data: string, options?: Options) => {
    return new CgService().main(action, data, options);
};
