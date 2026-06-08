import inquirer, { Answers } from 'inquirer';
import spinner from '../spinner';
import { logger } from '../logger';

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
    try {
        const result = await inquirer.prompt({ type: 'input', name: 'answer', message: input });
        afterInquire();
        return result.answer;
    } catch (error) {
        if ((error as Error).message === 'User force closed the prompt with SIGINT') {
            logger.info('用户取消选择');
        } else {
            logger.error((error as Error).message);
        }
        process.exit(0);
    }
};

export const select = async (input: string, choices: Answers['choices']) => {
    beforeInquire();
    try {
        const result = await inquirer.prompt({ type: 'select', name: 'answer', message: input, choices });
        afterInquire();
        return result.answer;
    } catch (error) {
        if ((error as Error).message === 'User force closed the prompt with SIGINT') {
            logger.info('用户取消选择');
        } else {
            logger.error((error as Error).message);
        }
        process.exit(0);
    }
};

export const confirm = async (input: string) => {
    beforeInquire();
    try {
        const result = await inquirer.prompt({ type: 'confirm', name: 'answer', message: input, default: false });
        afterInquire();
        return result.answer;
    } catch (error) {
        if ((error as Error).message === 'User force closed the prompt with SIGINT') {
            logger.info('用户取消选择');
        } else {
            logger.error((error as Error).message);
        }
        process.exit(0);
    }
};

export const multiSelect = async (input: string, choices: Answers['choices']) => {
    beforeInquire();
    try {
        const result = await inquirer.prompt({ type: 'checkbox', name: 'answer', message: input, choices });
        afterInquire();
        return result.answer;
    } catch (error) {
        if ((error as Error).message === 'User force closed the prompt with SIGINT') {
            logger.info('用户取消选择');
        } else {
            logger.error((error as Error).message);
        }
        process.exit(0);
    }
};
