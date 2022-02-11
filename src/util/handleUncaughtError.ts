import inquirer from './inquirer.js';
import boxen from 'boxen';
import createCallsiteRecord, { CallsiteRecord } from 'callsite-record';
import path from 'path';
import chalk from 'chalk';
import logger from './logger.js';
import { openInEditor, root } from './helper.js';

export default async () => {
  process.on('uncaughtException', async (e) => {
    errorHandler(e, {
      type: 'Uncaught Exception'
    });
  });
  process.on('unhandledRejection', async (e) => {
    errorHandler(e as Error, {
      async: true,
      type: 'Unhandled Rejection'
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
    console.log(
      boxen(`${chalk.bold.red(`${options.type}!`)}\n${e.message}`, {
        align: 'center',
        borderColor: 'red',
        dimBorder: true,
        padding: 1,
        margin: 1,
        float: 'left'
      })
    );
    console.log(
      (createCallsiteRecord({ forError: e }) as CallsiteRecord).renderSync({})
    );
    if (process.cwd() === root) {
      return;
    }
    const ans = (await inquirer.prompt({
      type: 'confirm',
      message: `发现未处理的${
        options.async ? '异步' : ''
      }错误，是否打开编辑器修复bug？`,
      name: 'open'
    })) as {
      open: boolean;
    };
    if (ans.open) {
      openInEditor(path.resolve(root));
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error((error as Error).message);
  }
}
