import Kill, { IOption, Params } from '@/core/kill';

export default async (args: Params, options?: IOption) => {
    await new Kill().main(...args);
};
