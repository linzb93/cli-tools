import axios from 'axios';
import { load } from 'cheerio';

export const getHtml = async (baseURL: string, path: string) => {
    const service = axios.create({
        baseURL,
    });
    const { data } = await service.post(path);
    return load(data);
};
