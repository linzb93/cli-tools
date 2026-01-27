import { ServerManager, Options } from '@cli-tools/shared/src/core/server';

export const serverCommand = (command: string, options: Options) => {
    new ServerManager().main(command, {
        ...options,
        exit: true,
    });
};
