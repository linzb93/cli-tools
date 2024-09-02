import Token, {Options} from "@/service/token";

export default (data: string, options: Options) => {
  return new Token().main(data, options);
};