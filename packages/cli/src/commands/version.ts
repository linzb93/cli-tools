import { version } from '@cli-tools/shared/business/version';

export const versionCommand = (text: string) => {
    version(text);
};
