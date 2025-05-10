import Tree, { Options } from '@/core/tree';

export default async (dir: string, options: Options) => {
    new Tree().main(dir, options);
};
