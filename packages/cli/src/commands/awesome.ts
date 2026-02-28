import { awesomeService, AwesomeOptions } from '@/business/awesome/get/index';
import { awesomeEditService } from '@/business/awesome/edit/index';
import { awesomeDeleteService } from '@/business/awesome/delete/index';
import { awesomeListTagsService } from '@/business/awesome/list-tags/index';
import { awesomeBatchEditTagsService, getBatchEditInput } from '@/business/awesome/batch-edit-tags/index';
const getAwesome = async (options?: AwesomeOptions) => {
    await awesomeService(options);
};

export const awesomeCommand = async (command: string, options?: AwesomeOptions) => {
    if (command === 'add' || command === 'edit') {
        await awesomeEditService(command, options);
        return;
    }
    if (command === 'delete') {
        await awesomeDeleteService(options);
        return;
    }
    if (command === 'list-tags') {
        await awesomeListTagsService();
        return;
    }
    if (command === 'batch-edit-tags') {
        const tagMappings = await getBatchEditInput();
        if (tagMappings.length > 0) {
            await awesomeBatchEditTagsService(tagMappings);
        }
        return;
    }
    await getAwesome(options);
};
