import serviceGenerator from "./base";
import sql from "@/common/sql";
const service = serviceGenerator({
  baseURL: "",
});

const getPrefix = async (isTest: boolean) => {
  return await sql(db => isTest ? db.oa.testPrefix : db.oa.apiPrefix);
};

export const getMeituanShopUrl = async (params:any, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(`${prefix}/occ/order/replaceUserLogin`,params);
  return res.data.result;
}

export const getEleShopList = async (params:any, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(`${prefix}/eleOcc/manage/getOrderList`,{
    ...params,
    pageSize:1,
    pageIndex:1
  });
  return res.data.result;
}

export const getEleShopUrl = async (params:any, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(`${prefix}/eleOcc/auth/onelogin`,params);
  return res.data.result;
}

export const getMeituanUserInfo = async(token:string, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(`${prefix}/meituan/homeUserInfo`,{
  }, {
    headers: {
      token
    }
  });
  return res.data.result;
}
export const getEleUserInfo = async(token:string, isTest: boolean) => {
  const prefix = await getPrefix(isTest);
  const res = await service.post(`${prefix}/meituan/homeUserInfo`,{
  }, {
    headers: {
      token
    }
  });
  return res.data.result;
}

export const getChainList = async (params:any, isTest: boolean) => {
  const prefix = await sql(db => db.oa.oldApiPrefix);
  const res = await service.post(`${prefix}/chain/occ/oa/dkdAccountDetails/accountAnalysisList`,{
    ...params,
    pageSize: 1,
    pageIndex:1
  });
  return res.data.result;
}

export const getChainShopInfo = async (params:any, isTest: boolean) => {
  const prefix = await sql(db => db.oa.oldApiPrefix);
  const res = await service.post(`${prefix}/chain/occ/dkdAccount/oa/getAccountToken`,params);
  return res.data.result;
}