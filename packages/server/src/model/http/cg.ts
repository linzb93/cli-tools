import serviceGenerator, { Response } from "./base";
import ls from "@/common/ls";

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
  const res = await service.post(`${ls.get("cg.oldPrefix")}/AppApi/GetDkdData`);
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
  const res = await service.post(
    `${ls.get("oa.apiPrefix")}/dkd/ad/forecast/query`
  );
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
export const setUserForcast = (params: ForcastParams) => {
  return service.post(
    `${ls.get("oa.apiPrefix")}/dkd/ad/forecast/insert`,
    params
  );
};
