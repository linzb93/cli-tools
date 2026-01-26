import { SassManager } from '@/core/sass';

export const sassCommand = function (): void {
    new SassManager().main();
};
