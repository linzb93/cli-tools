import { VersionService } from '@cli-tools/shared/src/business/version';

export const versionCommand = (text: string) => {
    new VersionService().main(text);
};
