import serviceGenerator, { Response } from "./base";
import sql from "@/common/sql";
const service = serviceGenerator({
  baseURL: "",
});

interface Options {
  test: boolean;
}

export const getUserList = async (
  url: string,
  params: any,
  options?: Options
) => {
  const prefix = await getPrefix(options);
  const res = await service.post(`${prefix}/dkd/ad/forecast/query`);
  return res.data as any;
};

const getPrefix = async (option?: Options) => {
  return option?.test ? "" : "";
};
