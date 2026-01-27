import { SassManager } from '@cli-tools/shared/src/core/sass';

export const sassCommand = function (): void {
    new SassManager().main();
};
