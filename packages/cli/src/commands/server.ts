import { server, Options } from '@cli-tools/shared/business/server';

export const serverCommand = (command: string, options: Options) => {
    server(command, {
        ...options,
        exit: true,
    });
};
