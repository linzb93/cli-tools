import Mock, { Options } from "@/service/mock";

export default (action: string, options: Options) => {
  new Mock().main(action, options);
};
