import Agent, { Options } from '@/core/agent';

export default (options: Options) => {
    new Agent().main(options);
};
