import rawInquirer, { QuestionCollection } from 'inquirer';
import spinner from './spinner.js';
const inquirer = {
  async prompt(options: QuestionCollection) {
    if (spinner.isSpinning) {
      spinner.stop();
    }
    const answer = await rawInquirer.prompt(options);
    if (spinner.text !== '') {
      spinner.start();
    }
    return answer;
  }
};

export default inquirer;
