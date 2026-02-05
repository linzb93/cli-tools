import { SassService } from '@cli-tools/shared/business/sass';

export const sassCommand = function (): void {
    new SassService().main();
};
