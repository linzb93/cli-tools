import { awesomeService, AwesomeOptions } from '@cli-tools/shared/business/awesome/get/index';
import { awesomeEditService } from '@cli-tools/shared/business/awesome/edit/index';
import { awesomeDeleteService } from '@cli-tools/shared/business/awesome/delete/index';
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
    await getAwesome(options);
};
