import { YapiService } from '@cli-tools/shared/src/business/yapi';

/**
 * Yapi接口文档获取命令
 * @param url Yapi网址
 */
export const yapiCommand = (url: string) => {
    new YapiService().main(url);
};
