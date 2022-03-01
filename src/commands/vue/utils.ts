import chalk from 'chalk';
import inquirer from '../../util/inquirer.js';

interface Params {
  source: any[];
  tip: string;
  isServe: boolean;
}

export const getMatches = async (params: Params): Promise<any> => {
  const { source, tip, isServe } = params;
  if (source.length > 1) {
    const answer = await inquirer.prompt({
      name: 'cwd',
      message: tip,
      choices: source.map((item) => ({
        value: item.cwd,
        name: `${item.name}(${chalk.gray(item.cwd)})`
      })),
      type: isServe ? 'list' : 'checkbox'
    });
    if (isServe) {
      return source.find((item) => item.cwd === answer.cwd);
    } else {
      return source.filter((item) => answer.cwd.includes(item.cwd));
    }
  }
  return source[0];
};
