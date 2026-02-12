import { awesomeService, AwesomeOptions } from '@cli-tools/shared/business/awesome/index';

export const awesomeCommand = async (options?: AwesomeOptions) => {
    await awesomeService(options);
};
