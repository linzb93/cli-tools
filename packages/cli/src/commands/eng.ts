import { engService, Options } from '@/business/translate';

export const engCommand = async (text: string | undefined, options: Options) => {
    await engService(text, options);
};
