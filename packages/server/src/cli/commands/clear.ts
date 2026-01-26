import Clear, { IOptions } from '@/core/clear';

export const clearCommand = (filename: string, options?: IOptions) => {
    return new Clear().main(filename, options);
};
