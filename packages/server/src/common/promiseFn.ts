import { execaCommand as execa } from "execa";
import chalk from "chalk";
import { showWeakenTips } from "./helper";

// 按顺序执行异步函数，返回第一个成功的结果
export const pLocate = async (
  list: any[],
  callback: Function
): Promise<any> => {
  for (let i = 0; i < list.length; i++) {
    try {
      return await callback(list[i]);
    } catch (error) {
      //
    }
  }
  throw new Error("err");
};
type PromiseFunc = () => Promise<any>;
export const pRetry = async (
  input: PromiseFunc,
  {
    retryTimes = 10,
    retryTimesCallback,
  }: {
    retryTimes: number;
    retryTimesCallback?(c: number, message?: string): void;
  }
): Promise<any> => {
  let count = 0;
  const retryFunc = async (
    ipt: PromiseFunc,
    retryTimesTime: number
  ): Promise<any> => {
    try {
      return await ipt();
    } catch (error) {
      count++;
      typeof retryTimesCallback === "function" &&
        retryTimesCallback(count, (error as Error).message);
      if (count === retryTimesTime) {
        throw error;
      } else {
        return retryFunc(ipt, retryTimesTime);
      }
    }
  };
  let data;
  try {
    data = await retryFunc(input, retryTimes);
  } catch (error) {
    throw error;
  }
  return data;
};

export interface CommandItem {
  message: string;
  suffix?: string;
  retryTimes?: number;
  onError?: Function;
}
export const sequenceExec = async (commandList: (string | CommandItem)[]) => {
  for (const commandItem of commandList) {
    const command =
      typeof commandItem === "string" ? commandItem : commandItem.message;
    if (!command) {
      return;
    }
    console.log(
      `${chalk.cyan(">")} ${chalk.yellow(command)}${
        (commandItem as CommandItem).suffix
          ? ` ${chalk.gray(`-> ${(commandItem as CommandItem).suffix}`)}`
          : ""
      }`
    );
    if (process.env.DEBUG) {
      continue;
    }
    try {
      if ((commandItem as CommandItem).retryTimes) {
        const { stdout } = await pRetry(() => execa(command), {
          retryTimes: (commandItem as CommandItem).retryTimes as number,
          retryTimesCallback: (times, errorMessage) => {
            console.log(
              showWeakenTips(
                `${chalk.yellow(command)} 第${chalk.magenta(times)}次重复。`,
                errorMessage as string
              )
            );
          },
        });
        if (stdout) {
          console.log(stdout);
        }
      } else {
        const { stdout } = await execa(command);
        if (stdout) {
          console.log(stdout);
        }
      }
    } catch (error) {
      if (typeof (commandItem as CommandItem).onError === "function") {
        try {
          await ((commandItem as CommandItem).onError as Function)(
            (error as Error).message
          );
        } catch (e) {
          throw e;
        }
      } else {
        throw error;
      }
    }
  }
};

export const isPromise = (fn: any) =>
  typeof fn.then === "function" && fn.catch === "function";
