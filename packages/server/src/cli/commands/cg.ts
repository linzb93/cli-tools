import Cg, { Options } from '@/core/cg';

export default (action: string, data: string, options?: Options) => {
    return new Cg().main(action, data, options);
};
