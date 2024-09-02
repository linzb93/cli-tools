import Tree, { Options } from "@/service/tree";

export default async (dir: string, options: Options) => {
  new Tree().main(dir, options);
};