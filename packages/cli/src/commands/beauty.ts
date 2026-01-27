import { BeautyService } from '@cli-tools/shared/src/business/beauty';

export const beautyCommand = () => {
    return new BeautyService().main();
};
