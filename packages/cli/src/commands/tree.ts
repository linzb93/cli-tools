import { treeService, Options } from '@/business/tree';

export const treeCommand = (dir: string, options: Options) => {
    treeService(dir, options);
};
