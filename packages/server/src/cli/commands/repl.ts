import repl from 'node:repl';
import dayjs from 'dayjs';
import * as lodash from 'lodash-es';
import chalk from 'chalk';

export const replCommand = () => {
    console.log(chalk.red('press `.exit` to quit'));
    const instance = repl.start({
        prompt: chalk.cyan('>'),
    });
    instance.context.dayjs = dayjs;
    instance.context.lodash = lodash;
    instance.on('close', () => {
        console.log(chalk.yellow('say goodbye from repl'));
    });
};
