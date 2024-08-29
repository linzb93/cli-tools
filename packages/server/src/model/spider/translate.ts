import serviceGenerator from '../http/base';
import { load } from "cheerio";
const service = serviceGenerator({
  baseURL: 'https://youdao.com/w/eng'
})

export const getHtml = async (text: string) => {
  const { data } = await service.post(encodeURIComponent(text));
  return load(data);
}