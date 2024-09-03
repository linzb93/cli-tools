import serviceGenerator from "./base";
import ls from "@/common/ls";

const service = serviceGenerator({
  baseURL: '',
});

/**
 * 获取今日以及本月业绩
 */
export const getPerformance = () => {
  return service.post(`${ls.get("cg.oldPrefix")}/AppApi/GetDkdData`).then(res => res.data);
}

/**
 * 获取用户预测结果列表
 */
export const userForcastList = () => {
  return service.post(`${ls.get("oa.apiPrefix")}/dkd/ad/forecast/query`).then(res => res.data);
}

interface ForcastParams {
  name: string;
  nameId: number;
  amount: number;
}
/**
 * 提交今日预测
 */
export const setUserForcast = (params: ForcastParams) => {
  return service.post(`${ls.get("oa.apiPrefix")}/dkd/ad/forecast/insert`, params);
}