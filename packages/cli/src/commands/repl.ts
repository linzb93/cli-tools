import { ReplManager } from '@cli-tools/shared/src/core/repl';

export const replCommand = () => {
    new ReplManager().main();
};
