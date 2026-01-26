import { ServerManager, Options } from '@/core/server';

export const serverCommand = (command: string, options: Options) => {
    new ServerManager().main(command, {
        ...options,
        exit: true,
    });
};
