import Analyse from "@/service/code/analyse";

export default function (prefix: string[]) {
  new Analyse().main(prefix);
}
