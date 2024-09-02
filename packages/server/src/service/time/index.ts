import dayjs from "dayjs";
import logger from "@/common/logger";
import BaseCommand from "@/common/BaseCommand";

export default class extends BaseCommand {
  main(timeParam: string): void {
    const time = this.get(timeParam);
    console.log(time);
  }
  get(timeParam: string) {
    const time = timeParam.toString();
    if ((time.length !== 10 && time.length !== 13) || !/^\d+$/.test(time)) {
      logger.error("请输入正确的时间戳格式", true);
      return "";
    }
    const targetDayjs =
      time.length === 10 ? dayjs(Number(time) * 1000) : dayjs(Number(time));
    const outputFormat = targetDayjs.format("YYYY-MM-DD HH:mm:ss");
    return outputFormat;
  }
}
