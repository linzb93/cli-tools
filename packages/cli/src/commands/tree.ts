import { treeService, Options } from '@cli-tools/shared/business/tree';

export const treeCommand = (dir: string, options: Options) => {
    treeService(dir, options);
};
