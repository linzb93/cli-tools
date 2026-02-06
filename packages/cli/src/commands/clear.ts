import { clearService, IOptions } from '@cli-tools/shared/business/clear';

export const clearCommand = (filename: string, options?: IOptions) => {
    return clearService(filename, options);
};
