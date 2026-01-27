import { ReplService } from '@cli-tools/shared/src/business/repl';

export const replCommand = () => {
    return new ReplService().main();
};
