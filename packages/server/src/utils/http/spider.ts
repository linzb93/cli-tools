import serviceGenerator from '.';
import { load } from 'cheerio';

export const getHtml = async (baseURL: string, path: string) => {
    const service = serviceGenerator({
        baseURL,
    });
    const { data } = await service.post(path);
    return load(data);
};
