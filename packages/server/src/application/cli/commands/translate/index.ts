import Translate, { Options } from "@/service/translate";
import { generateHelpDoc } from "@/common/helper";

function generateHelp() {
  generateHelpDoc({
    title: "翻译",
    content: `使用有道词典API进行翻译，自动判断是中译英还是英译中。
使用方法：
eng hello
选项：
- --example: 提供翻译示例`,
  });
}

export default (text: string, options: Options) => {
  if (options.help) {
    generateHelp();
    return;
  }
  new Translate().main(text, options);
};
