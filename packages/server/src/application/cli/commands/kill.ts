import Kill, { IOption, Params } from '@/service/kill';

export default async (args: Params, options?: IOption) => {
    await new Kill().main(...args);
};
