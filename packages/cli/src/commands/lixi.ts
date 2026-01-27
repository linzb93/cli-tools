import { LixiService } from '@cli-tools/shared/src/business/lixi';

export const lixiCommand = () => {
    new LixiService().main();
};
