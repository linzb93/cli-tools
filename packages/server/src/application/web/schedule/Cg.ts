import dayjs from "dayjs";
import Base from "./Base";
import { notify } from "@/common/helper";
import { getPerformanceData } from "@/service/cg/shared";
import { userForcastList } from "@/model/http/cg";
import sql from "@/common/sql";

export default class extends Base {
  name = "部门业绩";
  serveDateRange = ["2024-09-01", "2024-09-30"];
  private onDutyDate = "2024-09-25";
  private crons = {
    normal: "0 */30 * * * *",
    dutyDate: "0 */5 * * * *",
  };
  cron = "";
  private targets = [1, 2, 3, 4].map(item => ({
    value: item * 10000,
    passed: false,
  }));
  private isFinished = false;
  constructor() {
    super();
    const isDutyDate = dayjs().diff(this.onDutyDate, "d") === 0;
    this.cron = isDutyDate ? this.crons.dutyDate : this.crons.normal;
    this.checkTodayForecastSubmitted();
  }
  async onTick() {
    if (this.isFinished) {
      return;
    }
    try {
      const [todayData, monthData] = await getPerformanceData();
      for (let i = this.targets.length - 1; i >= 0; i--) {
        const item = this.targets[i];
        if (item.value <= todayData && !item.passed) {
          notify(`今日业绩：${todayData}，本月业绩：${monthData}。`);
          item.passed = true;
          if (i === this.targets.length - 1) {
            this.isFinished = true;
          }
          return;
        }
      }
    } catch (error) {
      //
    }
  }
  private async checkTodayForecastSubmitted() {
    const data = await userForcastList();
    const currentUser = await sql((db) => db.cg.author);
    if (!data.result.find((item) => item.name === currentUser)) {
      notify("您今日还未预测，请与10点前提交预测结果");
    }
  }
}
