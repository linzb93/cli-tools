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

export const ask = (input: string) =>
    inquirer.prompt({ type: 'input', name: 'answer', message: input }).then((answer) => answer.answer);

export const select = (input: string, choices: Answers['choices']) =>
    inquirer.prompt({ type: 'select', name: 'answer', message: input, choices }).then((answer) => answer.answer);

export const confirm = (input: string) =>
    inquirer
        .prompt({ type: 'confirm', name: 'answer', message: input, default: false })
        .then((answer) => answer.answer);

export const multiSelect = (input: string, choices: Answers['choices']) =>
    inquirer.prompt({ type: 'checkbox', name: 'answer', message: input, choices }).then((answer) => answer.answer);
