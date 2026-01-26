import { YapiManager } from '@/core/yapi';

/**
 * Yapi接口文档获取命令
 * @param url Yapi网址
 */
export const yapiCommand = (url: string) => {
    new YapiManager().main(url);
};
