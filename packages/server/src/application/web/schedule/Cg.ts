import Base from "./Base";

export default class extends Base {
  protected serveDateRange = ["2024-09-01", "2024-09-30"];
  private onDutyDate = "2024-09-25";
  private cron = {
    normal: "0 0 * * * *",
    dutyDate: "0 */5 * * * *",
  };
}
