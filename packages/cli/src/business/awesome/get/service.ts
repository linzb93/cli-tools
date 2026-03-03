import fs from 'fs-extra';
import chalk from 'chalk';
import open from 'open';
import inquirer from '@/utils/inquirer';
import { filePath } from '../shared/constant';
import { logger } from '@/utils/logger';
import type { AwesomeOptions, AwesomeItem } from '../shared/types';

export const awesomeService = async (options?: AwesomeOptions) => {
    const keyword = options?.name || '';

    if (!fs.existsSync(filePath)) {
        logger.error(`Error: File not found at ${filePath}`);
        return;
    }

    try {
        const data: AwesomeItem[] = await fs.readJSON(filePath);
        let results = data;

        // Filter by keyword (title)
        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            results = results.filter((item) => item.title.toLowerCase().includes(lowerKeyword));
        }

        // Filter by tag
        if (options?.tag) {
            const searchTags = options.tag
                .toLowerCase()
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
            results = results.filter((item) => {
                const itemTags = (item.tag || '').toLowerCase().split(',');
                return searchTags.some((tag) => itemTags.some((t) => t.trim() === tag));
            });
        }

        if (results.length === 0) {
            logger.warn('No matching items found.');
            return;
        }

        logger.info(`Found ${results.length} items:`);

        if (results.length === 1) {
            const item = results[0];
            logger.info(chalk.green(`Opening: ${item.title} - ${item.description || ''}`));
            if (item.url) {
                await open(item.url, { wait: true });
            }
            return;
        }

        const choices = results.map((item) => ({
            name: `${chalk.blue(item.title)} - ${item.description || ''}`,
            value: item.url,
            disabled: !item.url ? 'No URL' : false,
        }));

        choices.push({ name: 'Exit', value: '', disabled: false });

        const { url } = await inquirer.prompt([
            {
                type: 'list',
                name: 'url',
                message: '请选择要打开的项:',
                choices,
                pageSize: 15,
            },
        ]);

        if (url) {
            logger.info(`Opening: ${url}`);
            await open(url, { wait: true });
        }
    } catch (error) {
        logger.error(`Error reading or parsing awesome.json: ${error}`);
    }
};
