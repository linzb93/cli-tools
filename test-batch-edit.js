import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { awesomeBatchEditTagsService } from '../packages/cli/src/business/awesome/batch-edit-tags/service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testBatchEditTags = async () => {
    const tagMappings = [
        { from: 'http', to: 'network' },
        { from: 'css', to: 'styling' }
    ];
    
    console.log('Testing batch edit tags with mappings:', tagMappings);
    
    try {
        const result = await awesomeBatchEditTagsService(tagMappings);
        console.log('Batch edit result:', result);
    } catch (error) {
        console.error('Error during batch edit:', error);
    }
};

testBatchEditTags();