import Clear, { IOptions } from '@/core/clear';

export default (filename: string, options?: IOptions) => {
    return new Clear().main(filename, options);
};
