import { ClearManager, IOptions } from '@/core/clear';

export const clearCommand = (filename: string, options?: IOptions) => {
    return new ClearManager().main(filename, options);
};
