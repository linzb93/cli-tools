import server, {Options} from "@/service/server";


export default (command: string, options: Options) => {
  server(command, options);
}