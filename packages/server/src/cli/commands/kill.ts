import Kill, { IOption, Params } from '@/core/kill';

export default async (args: Params) => {
    await new Kill().main(...args);
};
