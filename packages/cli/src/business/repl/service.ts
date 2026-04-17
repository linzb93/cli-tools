import repl from 'node:repl';
import dayjs from 'dayjs';
import * as lodash from 'lodash-es';
import chalk from 'chalk';
import { logger } from '@/utils/logger';

export const replService = async () => {
    logger.clearConsole();
    logger.info(chalk.red('press `.exit` to quit'));
    const instance = repl.start({
        prompt: chalk.cyan('>'),
    });
    instance.context.dayjs = dayjs;
    instance.context.lodash = lodash;
    instance.on('close', () => {
        logger.info(chalk.yellow('say goodbye from repl'));
    });
};
