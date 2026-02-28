import fs from 'fs-extra';
import chalk from 'chalk';
import { filePath } from '../shared/constant';
import { logger } from '@/utils/logger';
import type { AwesomeItem } from '../shared/types';

export const awesomeListTagsService = async () => {
    if (!fs.existsSync(filePath)) {
        logger.error(`Error: File not found at ${filePath}`);
        return;
    }

    try {
        const data: AwesomeItem[] = await fs.readJSON(filePath);
        
        if (data.length === 0) {
            logger.warn('No items found in awesome.json');
            return;
        }

        const allTags: string[] = [];
        
        data.forEach(item => {
            if (item.tag) {
                const tags = item.tag
                    .split(',')
                    .map(t => t.trim().toLowerCase())
                    .filter(Boolean);
                allTags.push(...tags);
            }
        });

        if (allTags.length === 0) {
            logger.warn('No tags found in any items');
            return;
        }

        const uniqueTags = [...new Set(allTags)].sort();
        
        logger.info(`Found ${uniqueTags.length} unique tags:`);
        
        uniqueTags.forEach((tag, index) => {
            logger.info(`${chalk.green(`${index + 1}.`)} ${tag}`);
        });
        
    } catch (error) {
        logger.error(`Error reading or parsing awesome.json: ${error}`);
    }
};