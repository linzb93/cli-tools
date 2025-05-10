import Mock, { Options } from '@/core/mock';

export default (action: string, options: Options) => {
    new Mock().main(action, options);
};
