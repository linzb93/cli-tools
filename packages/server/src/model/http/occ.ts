import serviceGenerator from "./base";
import sql from "@/common/sql";
import { HTTP_STATUS } from "@/common/constant";
import fs from "fs-extra";
import { join } from "node:path";
import { tempPath } from "@/common/constant";
import open from "open";
import inquirer from "@/common/inquirer";

const service = serviceGenerator({
  baseURL: "",
});

const getPrefix = async (isTest: boolean) => {
  return await sql((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
};
/**
 * 获取美团店铺列表
 * @param params
 * @returns
 */
export const getMeituanShopList = async (params: any) => {
  const prefix = await sql((db) => db.oa.apiPrefix);
  const res = await service.post(`${prefix}/query/businessInfoList`, params);
  if (res.data.code === HTTP_STATUS.NOTLOGIN) {
    await login();
    return await getMeituanShopList(params);
  }
};
/**
 * 获取美团订单列表
 * @param params
 * @returns
 */
export const getMeituanOrderList = async (params: any) => {
  const prefix = await sql((db) => db.oa.apiPrefix);
  const res = await service.post(`${prefix}/query/businessInfoList`, params);
  return res.data.result.list;
};
export const login = async () => {
  const res = await service.post("/captchaImage", {});
  const { img } = res.data;
  const filePath = join(tempPath, `${Date.now()}.png`);
  await fs.writeFile(filePath, Buffer.from(img));
  await open(filePath);
  const answer = await inquirer.prompt({
    message: "token已过期，请输入登录验证码",
    name: "code",
    type: "input",
  });
  const { username, password } = await sql((db) => db.oa);
  await service.post("/login", {
    code: answer.code,
    username,
    password,
  });
};

export const getMeituanShopUrl = async (params: any, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(
    `${prefix}/occ/order/replaceUserLogin`,
    params
  );
  return res.data.result;
};

export const getTrackUserList = async (params: any) => {
  const res = await service.post("/", {});
  return res.data.result.list;
};

export const getEleShopList = async (params: any, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(`${prefix}/eleOcc/manage/getOrderList`, {
    ...params,
    pageSize: 1,
    pageIndex: 1,
  });
  return res.data.result;
};

export const getEleShopUrl = async (params: any, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(`${prefix}/eleOcc/auth/onelogin`, params);
  return res.data.result;
};

export const getMeituanUserInfo = async (token: string, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(
    `${prefix}/meituan/homeUserInfo`,
    {},
    {
      headers: {
        token,
      },
    }
  );
  return res.data.result;
};
export const getEleUserInfo = async (token: string, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(
    `${prefix}/meituan/homeUserInfo`,
    {},
    {
      headers: {
        token,
      },
    }
  );
  return res.data.result;
};

export const getChainList = async (params: any, isTest: boolean) => {
  const prefix = await sql((db) => db.oa.oldApiPrefix);
  const res = await service.post(
    `${prefix}/chain/occ/oa/dkdAccountDetails/accountAnalysisList`,
    {
      ...params,
      pageSize: 1,
      pageIndex: 1,
    }
  );
  return res.data.result;
};

export const getChainShopInfo = async (params: any, isTest: boolean) => {
  const prefix = await sql((db) => db.oa.oldApiPrefix);
  const res = await service.post(
    `${prefix}/chain/occ/dkdAccount/oa/getAccountToken`,
    params
  );
  return res.data.result;
};
