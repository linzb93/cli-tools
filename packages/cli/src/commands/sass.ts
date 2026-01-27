import { SassService } from '@cli-tools/shared/src/business/sass';

export const sassCommand = function (): void {
    new SassService().main();
};
