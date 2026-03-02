import inquirer, { Answers } from 'inquirer';
import spinner from './spinner';

export default {
    async prompt(options: Answers) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        const answer = await inquirer.prompt(options);
        if (spinner.text !== '') {
            spinner.start();
        }
        return answer;
    },
};
