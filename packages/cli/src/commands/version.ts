import { VersionService } from '@cli-tools/shared/business/version';

export const versionCommand = (text: string) => {
    new VersionService().main(text);
};
