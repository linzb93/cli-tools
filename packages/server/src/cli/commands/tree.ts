import { TreeManager, Options } from '@/core/tree';

export const treeCommand = (dir: string, options: Options) => {
    new TreeManager().main(dir, options);
};
