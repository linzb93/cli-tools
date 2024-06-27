import repl from 'node:repl';
import dayjs from 'dayjs';
import lodash from 'lodash-es';
import chalk from 'chalk';

export default () => {
    console.log(chalk.red('press `.exit` to quit'));
    const instance = repl.start({
        prompt: 'Node.js via stdin> ',
    });
    instance.context.dayjs = dayjs;
    instance.context.lodash = lodash;
}