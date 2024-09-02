import Uninstall, { Options } from "@/service/npm/uninstall";

export default async (args: string[], options: Options) => {
  new Uninstall().main(args, options);
};
