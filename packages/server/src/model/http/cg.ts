import serviceGenerator, { Response } from "./base";
import sql from "@/common/sql";
const service = serviceGenerator({
  baseURL: "",
});

interface DkdData {
  Result: {
    Total: {
      TodayTurnover: number;
      MonthTurnover: number;
    };
  };
}

/**
 * 获取今日以及本月业绩
 */
export const getPerformance = async () => {
  const prefix = await sql((db) => db.cg.oldPrefix);
  const res = await service.post(`${prefix}/AppApi/GetDkdData`);
  return res.data as DkdData;
};

type ForecastResult = Response<
  {
    name: string;
    amount: number;
    author: string;
  }[]
>;
/**
 * 获取用户预测结果列表
 */
export const userForcastList = async () => {
  const prefix = await sql((db) => db.oa.apiPrefix);
  const res = await service.post(`${prefix}/dkd/ad/forecast/query`);
  return res.data as ForecastResult;
};

interface ForcastParams {
  name: string;
  nameId: number;
  amount: number;
}
/**
 * 提交今日预测
 */
export const setUserForcast = async (params: ForcastParams) => {
  const prefix = await sql((db) => db.oa.apiPrefix);
  return service.post(`${prefix}/dkd/ad/forecast/insert`, params);
};
