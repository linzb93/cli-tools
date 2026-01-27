import { ClearService, IOptions } from '@cli-tools/shared/src/business/clear';

export const clearCommand = (filename: string, options?: IOptions) => {
    return new ClearService().main(filename, options);
};
