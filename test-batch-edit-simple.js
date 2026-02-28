import { awesomeBatchEditTagsService } from './packages/cli/src/business/awesome/batch-edit-tags/service.js';

const testBatchEdit = async () => {
    console.log('Testing batch edit tags...');
    
    const tagMappings = [
        { from: 'http', to: 'network' },
        { from: 'css', to: 'styling' }
    ];
    
    try {
        const result = await awesomeBatchEditTagsService(tagMappings);
        console.log('Batch edit completed:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};

testBatchEdit();