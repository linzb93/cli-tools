/**
 * cli进度条
 */
import Progress from 'progress';
import chalk from 'chalk';

let bar: Progress;

export default {
    setTotal(total: number) {
        bar = new Progress(':bar :current/:total', {
            total,
            width: 80,
            complete: chalk.bgGreen(' '),
            incomplete: ' ',
        });
    },
    tick() {
        bar.tick();
    },
};
