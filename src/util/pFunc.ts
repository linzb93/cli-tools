import { execaCommand as execa } from 'execa';
import chalk from 'chalk';

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
  throw new Error('err');
};
type PromiseFunc = () => Promise<any>;
export const pRetry = async (
  input: PromiseFunc,
  {
    retries = 10,
    retryTimesCallback
  }: {
    retries: number;
    retryTimesCallback?(c: number, message?: string): void;
  }
): Promise<any> => {
  let c = 0;
  const retryFunc = async (
    ipt: PromiseFunc,
    retriesTime: number
  ): Promise<any> => {
    try {
      return await ipt();
    } catch (error) {
      c++;
      typeof retryTimesCallback === 'function' &&
        retryTimesCallback(c, (error as Error).message);
      if (c === retriesTime) {
        throw error;
      } else {
        return retryFunc(ipt, retriesTime);
      }
    }
  };
  let data;
  try {
    data = await retryFunc(input, retries);
  } catch (error) {
    throw error;
  }
  return data;
};

interface CommandItem {
  message: string;
  retries?: number;
  onError?: Function;
}
export const sequenceExec = async (commandList: (string | CommandItem)[]) => {
  for (const commandItem of commandList) {
    const command =
      typeof commandItem === 'string' ? commandItem : commandItem.message;
    if (!command) {
      return;
    }
    console.log(`${chalk.cyan('actions:')} ${chalk.yellow(command)}`);
    try {
      if ((commandItem as CommandItem).retries) {
        const { stdout } = await pRetry(() => execa(command), {
          retries: (commandItem as CommandItem).retries as number,
          retryTimesCallback: (times, errorMessage) => {
            console.log(
              `${chalk.cyan('actions:')} ${chalk.yellow(
                command
              )} 第${chalk.magenta(times)}次重复。\n ${chalk.gray(
                `├─ ${errorMessage}`
              )}`
            );
          }
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
      if (typeof (commandItem as CommandItem).onError === 'function') {
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
