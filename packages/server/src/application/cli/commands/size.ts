import Size, { Options } from "@/service/size";

export default (filePath: string, options: Options) => {
  new Size().main(filePath, options);
};
