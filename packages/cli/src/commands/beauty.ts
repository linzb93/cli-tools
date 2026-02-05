import { BeautyService } from '@cli-tools/shared/business/beauty';

export const beautyCommand = () => {
    return new BeautyService().main();
};
