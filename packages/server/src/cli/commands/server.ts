import Server, { Options } from '@/core/server';

export default (command: string, options: Options) => {
    new Server().main(command, {
        ...options,
        exit: true,
    });
};
