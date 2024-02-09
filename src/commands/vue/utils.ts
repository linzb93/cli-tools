import chalk from 'chalk';
import inquirer from '../../util/inquirer.js';

interface Params {
  source: SourceItem[];
  tip: string;
}
interface SourceItem {
  cwd: string;
  name: string;
  buildPort: string;
  servePort: string;
}

export const getMatch = async (params: Params): Promise<SourceItem> => {
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
    return (
      source.find((item) => item.cwd === answer.cwd) || {
        cwd: '',
        name: '',
        buildPort: '',
        servePort: ''
      }
    );
  }
  return source[0];
};
