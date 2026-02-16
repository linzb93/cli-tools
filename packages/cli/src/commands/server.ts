import { server, Options } from '@/business/server';

export const serverCommand = (command: string, options: Options) => {
    server(command, {
        ...options,
        exit: true,
    });
};
