import rawInquirer, { QuestionCollection } from 'inquirer';
import spinner from './spinner.js';
import logger from './logger.js';
const inquirer = {
    async prompt(options: QuestionCollection) {
    if (spinner.isSpinning) {
      spinner.stop();
    }
    const answer = await rawInquirer.prompt(options);
    logger.backwardConsole();
    if (spinner.text !== '') {
        spinner.start();
    }
    return answer;
  }
};

export default inquirer;
