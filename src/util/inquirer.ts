import rawInquirer, { QuestionCollection } from 'inquirer';
import spinner from './spinner.js';

const inquirer = {
  prompt(options: QuestionCollection) {
    if (spinner.isSpinning) {
      spinner.stop();
    }
    return rawInquirer.prompt(options);
  }
};

export default inquirer;
