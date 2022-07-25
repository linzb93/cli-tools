import chalk from 'chalk';
import inquirer from '../../util/inquirer.js';

interface Params {
  source: any[];
  tip: string;
}

export const getMatch = async (params: Params): Promise<any> => {
  const { source, tip } = params;
  if (source.length > 1) {
    const answer = await inquirer.prompt({
      name: 'cwd',
      message: tip,
      choices: source.map((item) => ({
        value: item.cwd,
        name: `${item.name}(${chalk.gray(item.cwd)})`
      })),
      type: 'list'
    });
    return source.find((item) => item.cwd === answer.cwd);
  }
  return source[0];
};
