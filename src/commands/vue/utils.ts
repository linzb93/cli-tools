import chalk from 'chalk';
import inquirer from '../../util/inquirer.js';
import { VueServerInfo } from './index';
export const getMatch = async (
  items: any[],
  tip: string
): Promise<VueServerInfo> => {
  if (items.length > 1) {
    const answer = await inquirer.prompt({
      name: 'cwd',
      message: tip,
      choices: items.map((item) => ({
        value: item.cwd,
        name: `${item.name}(${chalk.gray(item.cwd)})`
      })),
      type: 'list'
    });
    return items.find((item) => item.cwd === answer.cwd) as VueServerInfo;
  }
  return items[0] as VueServerInfo;
};
