import { ReplService } from '@cli-tools/shared/business/repl';

export const replCommand = () => {
    return new ReplService().main();
};
