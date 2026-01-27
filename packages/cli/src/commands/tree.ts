import { TreeService, Options } from '@cli-tools/shared/src/business/tree';

export const treeCommand = (dir: string, options: Options) => {
    new TreeService().main(dir, options);
};
