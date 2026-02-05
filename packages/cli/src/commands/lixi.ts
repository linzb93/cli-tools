import { LixiService } from '@cli-tools/shared/business/lixi';

export const lixiCommand = () => {
    new LixiService().main();
};
