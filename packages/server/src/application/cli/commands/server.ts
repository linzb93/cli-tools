import Server, { Options } from "@/service/server";

export default (command: string, options: Options) => {
  new Server().main(command, options);
};
