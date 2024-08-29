import {getHtml} from '@/model/spider/translate';
import chalk from "chalk";
export const getMeanings = async (text: string) => {
  const $ = await getHtml(text);
  return Array.from(
    $(".trans-container")
      .first()
      .children("ul")
      .children()
      .map((_, item) => {
        const typeRet = $(item).text().replace(/\s/g, "");
        if (typeRet.includes(".")) {
          const type = typeRet.split(".")[0];
          return `${chalk.gray(type)} ${typeRet.split(".")[1]}`;
        }
        return typeRet;
      })
  )
}