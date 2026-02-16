import { clearService, IOptions } from '@/business/clear';

export const clearCommand = (filename: string, options?: IOptions) => {
    return clearService(filename, options);
};
