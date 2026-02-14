import fs from 'fs-extra';
import chalk from 'chalk';
import Table from 'cli-table3';
import { filePath } from '../shared/constant';
import type { AwesomeOptions, AwesomeItem } from '../shared/types';
export type { AwesomeOptions, AwesomeItem };

export const awesomeService = async (options?: AwesomeOptions) => {
    const keyword = options?.name || '';

    if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`Error: File not found at ${filePath}`));
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
            const lowerTag = options.tag.toLowerCase();
            results = results.filter((item) => (item.tag || '').toLowerCase().includes(lowerTag));
        }

        if (results.length === 0) {
            console.log(chalk.yellow('No matching items found.'));
            return;
        }

        console.log(chalk.green(`Found ${results.length} items:`));

        const table = new Table({
            head: ['Title', 'Description', 'Tag', 'URL'],
            colWidths: [20, 50, 15, 50],
            wordWrap: true,
        });

        results.forEach((item) => {
            table.push([
                chalk.cyan(item.title),
                item.description || '',
                chalk.magenta(item.tag || ''),
                chalk.blue(item.url || ''),
            ]);
        });

        console.log(table.toString());
    } catch (error) {
        console.error(chalk.red('Error reading or parsing awesome.json'), error);
    }
};
