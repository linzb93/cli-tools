import Yapi from '@/core/yapi';

/**
 * Yapi接口文档获取命令
 * @param url Yapi网址
 */
export default (url: string) => {
    new Yapi().main(url);
};
