import { ServerService, Options } from '@cli-tools/shared/src/business/server';

export const serverCommand = (command: string, options: Options) => {
    new ServerService().main(command, {
        ...options,
        exit: true,
    });
};
