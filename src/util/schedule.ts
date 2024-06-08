import dayjs from "dayjs";
/**
 * 如果某个服务有需要定时器，可以前来使用。
 */

type CommonFn = () => void;
interface IOptions {
  interval: number;
}
const createSchedule = (callback: CommonFn, options: IOptions) => {
  setInterval(callback, options.interval);
};

/**
 * 默认18点关机，自动结束服务。
 * @param callback
 */
export const onShutdown = (callback: CommonFn) => {
  createSchedule(
    () => {
      const today = dayjs().format("YYYY-MM-DD");
      if (dayjs().isAfter(`${today} 18:00:00`)) {
        callback();
      }
    },
    {
      interval: 1000 * 60,
    }
  );
};
