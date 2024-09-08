import dayjs from "dayjs";
import Base from "./Base";
import ls from "@/common/ls";
import { notify } from "@/common/helper";
import { getPerformanceData } from "@/service/cg/shared";
import { userForcastList } from "@/model/http/cg";

export default class extends Base {
  name = "部门业绩";
  serveDateRange = ["2024-09-01", "2024-09-30"];
  private onDutyDate = "2024-09-25";
  private crons = {
    normal: "0 0 * * * *",
    dutyDate: "0 */5 * * * *",
  };
  cron = "";
  private targets = [
    {
      num: 20000,
      passed: false,
    },
    {
      num: 30000,
      passed: false,
    },
  ];
  constructor() {
    super();
    const isDutyDate = dayjs().diff(this.onDutyDate, "d") === 0;
    this.cron = isDutyDate ? this.crons.dutyDate : this.crons.normal;
    this.checkTodayForecastSubmitted();
  }
  async onTick() {
    try {
      const [todayData, monthData] = await getPerformanceData();
      for (const target of this.targets) {
        if (target.passed) {
          continue;
        }
        if (target.num <= todayData) {
          target.passed = true;
          notify(`今日业绩：${todayData}，本月业绩：${monthData}。`);
          return;
        }
      }
    } catch (error) {
      //
    }
  }
  private async checkTodayForecastSubmitted() {
    const data = await userForcastList();
    const currentUser = ls.get("cg.author");
    if (!data.result.find((item) => item.name === currentUser)) {
      notify("您今日还未预测，请与10点前提交预测结果");
    }
  }
}
