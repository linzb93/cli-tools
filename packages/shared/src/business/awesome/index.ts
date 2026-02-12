import path from 'node:path';
import fs from 'fs-extra';
import chalk from 'chalk';
import Table from 'cli-table3';
import { cacheRoot } from '../../constant/path';

interface AwesomeItem {
    title: string;
    description: string;
    url: string;
    tag: string;
}

export interface AwesomeOptions {
    name?: string;
    tag?: string;
}

export const awesomeService = async (options?: AwesomeOptions) => {
    const keyword = options?.name || '';
    const jsonPath = path.resolve(cacheRoot, 'awesome.json');

    if (!fs.existsSync(jsonPath)) {
        console.log(chalk.red(`Error: File not found at ${jsonPath}`));
        return;
    }

    try {
        const data: AwesomeItem[] = await fs.readJSON(jsonPath);
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
