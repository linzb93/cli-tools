import { TreeManager, Options } from '@cli-tools/shared/src/core/tree';

export const treeCommand = (dir: string, options: Options) => {
    new TreeManager().main(dir, options);
};
