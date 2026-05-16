import inquirer, { Answers } from 'inquirer';
import spinner from '../spinner';

const beforeInquire = () => {
    if (spinner.isSpinning) {
        spinner.stop();
    }
};

const afterInquire = () => {
    if (spinner.text !== '') {
        spinner.start();
    }
};

export const ask = async (input: string) => {
    beforeInquire();
    const result = await inquirer.prompt({ type: 'input', name: 'answer', message: input });
    afterInquire();
    return result.answer;
};

export const select = async (input: string, choices: Answers['choices']) => {
    beforeInquire();
    const result = await inquirer.prompt({ type: 'select', name: 'answer', message: input, choices });
    afterInquire();
    return result.answer;
};

export const confirm = async (input: string) => {
    beforeInquire();
    const result = await inquirer.prompt({ type: 'confirm', name: 'answer', message: input, default: false });
    afterInquire();
    return result.answer;
};

export const multiSelect = async (input: string, choices: Answers['choices']) => {
    beforeInquire();
    const result = await inquirer.prompt({ type: 'checkbox', name: 'answer', message: input, choices });
    afterInquire();
    return result.answer;
};
