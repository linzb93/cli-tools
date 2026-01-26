import { BeautyManager } from '@/core/beauty';

export const beautyCommand = () => {
    return new BeautyManager().main();
};
