import Time from "@/service/time";

export default function (timeParam: string) {
  new Time().main(timeParam);
}
