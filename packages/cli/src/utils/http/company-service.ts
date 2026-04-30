import axios, { AxiosRequestConfig } from 'axios';
import { HTTP_STATUS } from '@cli-tools/shared';
interface IOptions {
    baseURL: string;
}

/**
 * Service 泛型接口，定义 post 方法的返回类型
 * @interface IService
 * @template T 响应数据类型，默认为 any
 */
interface IService<T = any> {
    post<R = T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R>;
    get<R = T>(url: string, config?: AxiosRequestConfig): Promise<R>;
}

/**
 * 生成 axios 实例
 * @param options 配置项
 * @returns IService<T> 实例
 */
const useService = <T = any>(options: IOptions): IService<T> => {
    const instance = axios.create({
        baseURL: options.baseURL,
    });
    instance.interceptors.response.use(
        (response) => {
            if (response.data.code !== HTTP_STATUS.SUCCESS) {
                console.log(response.config.url);
                throw new Error(response.data.msg);
            }
            return response.data.result;
        },
        (error) => {
            return Promise.reject(error);
        },
    );
    return instance as IService<T>;
};
export const service = useService({ baseURL: '' });
