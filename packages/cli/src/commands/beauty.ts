import { BeautyManager } from '@cli-tools/shared/src/core/beauty';

export const beautyCommand = () => {
    return new BeautyManager().main();
};
