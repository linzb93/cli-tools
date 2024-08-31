import serviceGenerator from "../http/base";
import { load } from "cheerio";

const baseURL = "https://youdao.com/w/eng";
const service = serviceGenerator({
  baseURL,
});
export const getPageUrl = (text: string) =>
  `${baseURL}/${encodeURIComponent(text)}`;
export const getHtml = async (text: string) => {
  const { data } = await service.post(getPageUrl(text));
  return load(data);
};
