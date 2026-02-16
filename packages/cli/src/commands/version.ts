import { version } from '@/business/version';

export const versionCommand = (text: string) => {
    version(text);
};
