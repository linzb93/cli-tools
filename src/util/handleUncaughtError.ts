import path from "node:path";
import chalk from "chalk";
import createCallsiteRecord, { CallsiteRecord } from "callsite-record";
import inquirer from "./inquirer";
import logger from "./logger";
import spinner from "./spinner";
import { openInEditor, root } from "./helper";

export default async () => {
  process.on("uncaughtException", async (e) => {
    errorHandler(e, {
      type: "Uncaught Exception",
    });
  });
  process.on("unhandledRejection", async (e) => {
    errorHandler(e as Error, {
      async: true,
      type: "Unhandled Rejection",
    });
  });
};

// 处理全局未捕捉的错误
async function errorHandler(
  e: Error,
  options: {
    async?: boolean;
    type?: string;
  } = {}
): Promise<void> {
  logger.clearConsole(1);
  try {
    console.log(`${chalk.bold.red(`${options.type}!`)}\n${e.message}`);
    if (createCallsiteRecord({ forError: e })) {
      console.log(
        (createCallsiteRecord({ forError: e }) as CallsiteRecord).renderSync({})
      );
    }
    spinner.stop();
    if (`${process.cwd()}\\` === root) {
      return;
    }
    const { openEditor } = (await inquirer.prompt({
      type: "confirm",
      message: `发现未处理的${
        options.async ? "异步" : ""
      }错误，是否打开编辑器修复bug？`,
      name: "openEditor",
    })) as {
      openEditor: boolean;
    };
    if (openEditor) {
      openInEditor(path.resolve(root));
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error((error as Error).message);
  }
}
