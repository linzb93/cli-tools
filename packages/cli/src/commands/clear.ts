import { ClearManager, IOptions } from '@cli-tools/shared/src/core/clear';

export const clearCommand = (filename: string, options?: IOptions) => {
    return new ClearManager().main(filename, options);
};
