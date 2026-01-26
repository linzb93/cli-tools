import Tree, { Options } from '@/core/tree';

export const treeCommand = (dir: string, options: Options) => {
    new Tree().main(dir, options);
};
