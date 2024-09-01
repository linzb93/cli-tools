import Color, { Options } from "@/service/color";

export default function (text: string, options: Options) {
  new Color().main(text, options);
}
