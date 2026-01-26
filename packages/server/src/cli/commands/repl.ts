import { ReplManager } from '@/core/repl';

export const replCommand = () => {
    new ReplManager().main();
};
