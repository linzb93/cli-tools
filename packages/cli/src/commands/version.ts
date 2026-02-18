import { versionService } from '@/business/version';

export const versionCommand = (text: string) => {
    versionService({ versionArg: text });
};
