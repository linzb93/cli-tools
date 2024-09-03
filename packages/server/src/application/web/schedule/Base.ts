export default abstract class {
  /**
   * 服务执行日期，超过日期会有提示
   */
  serveDateRange: string[] = [];
  /**
   * Cron格式
   */
  cron = ''
  /**
   * 任务触发时间到，触发回调
   */
  abstract onTick():void
}
