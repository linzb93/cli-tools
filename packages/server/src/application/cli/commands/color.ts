import Color, { Options } from "@/service/color";
import { generateHelpDoc } from "@/common/helper";

function generateHelp() {
  generateHelpDoc({
    title: "color",
    content: `转换颜色显示
color '#333' => '51,51,51'
color '255,255,255' => '#fff'`,
  });
}

export default function (text: string, options: Options) {
  if (options.help) {
    generateHelp();
    return;
  }
  new Color().main(text, options);
}
