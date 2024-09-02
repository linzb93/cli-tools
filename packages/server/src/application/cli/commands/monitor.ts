import Monitor from "@/service/monitor";

export default (filename: string, combinedOptions: string[]) => {
  new Monitor().main(filename, combinedOptions);
};
