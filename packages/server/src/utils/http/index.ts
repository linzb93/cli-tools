import axios from 'axios';

interface IOptions {
    baseURL: string;
}

/**
 * 生成 axios 实例
 * @param options 配置项
 * @returns axios 实例
 */
export default (options: IOptions) => {
    const service = axios.create({
        baseURL: options.baseURL,
    });
    return service;
};

export interface Response<T> {
    code: number;
    result: T;
}
