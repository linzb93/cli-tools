import { CheckboxQuestion } from "inquirer";
import pMap from "p-map";
import { reactive } from "@vue/reactivity";
import { watch } from "@vue/runtime-core";
import logger from "@/util/logger";
import inquirer from "@/util/inquirer";
import spinner from "@/util/spinner";

interface IOptions {
  name: string;
  choices: string[];
  deleteFn: (item: string, opt?: { includeRemote: boolean }) => Promise<void>;
}

export default async (options: IOptions) => {
  const { choices, name } = options;
  if (!choices.length) {
    logger.info(`没有${name}可以删除`);
    process.exit(1);
  }
  logger.clearConsole();
  const { selected } = await inquirer.prompt({
    message: `请选择需要删除的${name}`,
    name: "selected",
    type: "checkbox",
    choices,
    c1: 2,
  } as CheckboxQuestion);
  if (!selected.length) {
    logger.info(`未选中需要删除的${name}`);
    process.exit(1);
  }
  spinner.text = "开始删除";
  const successItems = reactive([]) as string[];
  const errorItems = reactive([]) as { item: string; errorMessage: string }[];
  watch(successItems, (value) => {
    spinner.text = `删除成功${value.length}个，失败${errorItems.length}个`;
  });
  watch(errorItems, (value) => {
    spinner.text = `删除成功${successItems.length}个，失败${value.length}个`;
  });
  await pMap(
    selected,
    async (item: string) => {
      try {
        await Promise.all([
          options.deleteFn(item),
          options.deleteFn(item, { includeRemote: true }),
        ]);
      } catch (error) {
        errorItems.push({
          item,
          errorMessage: (error as Error).message,
        });
        return;
      }
      successItems.push(item);
    },
    { concurrency: 5 }
  );
  spinner.succeed();
  if (errorItems.length) {
    logger.error(errorItems.join(","));
  }
};
