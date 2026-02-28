import fs from 'fs-extra';
import chalk from 'chalk';
import { filePath } from '../shared/constant';
import { logger } from '@/utils/logger';
import type { AwesomeItem } from '../shared/types';

export interface TagMapping {
    from: string;
    to: string;
}

export const awesomeBatchEditTagsService = async (tagMappings: TagMapping[]) => {
    if (!fs.existsSync(filePath)) {
        logger.error(`Error: File not found at ${filePath}`);
        return false;
    }

    if (tagMappings.length === 0) {
        logger.warn('No tag mappings provided');
        return false;
    }

    try {
        const data: AwesomeItem[] = await fs.readJSON(filePath);
        
        if (data.length === 0) {
            logger.warn('No items found in awesome.json');
            return false;
        }

        let totalReplacements = 0;
        const updatedData = data.map(item => {
            if (!item.tag) {
                return item;
            }

            let updatedTag = item.tag;
            let itemModified = false;

            tagMappings.forEach(mapping => {
                const fromTag = mapping.from.toLowerCase().trim();
                const toTag = mapping.to.trim();
                
                if (fromTag === toTag.toLowerCase()) {
                    return;
                }

                const tags = updatedTag.split(',').map(tag => tag.trim());
                const updatedTags = tags.map(tag => {
                    if (tag.toLowerCase() === fromTag) {
                        itemModified = true;
                        totalReplacements++;
                        return toTag;
                    }
                    return tag;
                });

                if (itemModified) {
                    updatedTag = updatedTags.join(', ');
                }
            });

            if (itemModified) {
                return {
                    ...item,
                    tag: updatedTag
                };
            }
            
            return item;
        });

        if (totalReplacements === 0) {
            logger.info('No tags were modified');
            return false;
        }

        await fs.writeJSON(filePath, updatedData, { spaces: 2 });
        
        logger.success(`Successfully updated ${totalReplacements} tag occurrences`);
        
        tagMappings.forEach(mapping => {
            logger.info(`${chalk.red(mapping.from)} → ${chalk.green(mapping.to)}`);
        });
        
        return true;
        
    } catch (error) {
        logger.error(`Error processing awesome.json: ${error}`);
        return false;
    }
};