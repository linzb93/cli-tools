
import {
  getPerformance,
} from "@/model/http/cg";

/**
   * 返回本日业绩和本月业绩
   */
export async function getPerformanceData() {
  try {
    const data = await getPerformance();
    return [data.Result.Total.TodayTurnover, data.Result.Total.MonthTurnover];
  } catch (error) {
    throw new Error("服务器故障，请稍后再试");
  }
}