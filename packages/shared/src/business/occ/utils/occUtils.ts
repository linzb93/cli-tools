import clipboard from 'clipboardy';
import { logger } from '@cli-tools/shared/utils/logger';
import open from 'open';
import { UserInfo } from '../types';

/**
 * OCC 工具类
 */
export default class OccUtils {
    static getOccUrl(occUrl: string) {
        return occUrl;
    }
    /**
     * 将token复制到剪贴板
     * @param obj - 包含token、服务名称和店铺名称的对象
     */
    copyToken(obj: { token: string; serviceName: string; shopName: string }) {
        clipboard.writeSync(obj.token);
        logger.success(`【${obj.serviceName}】已复制店铺【${obj.shopName}】的token\n${obj.token}`);
    }
    /**
     * 补齐完整的登录地址
     * @param obj - 包含url、token和服务名称的对象
     */
    fixURL(obj: { url: string; token: string; serviceName: string }) {
        const formattedUrl = obj.url.endsWith('#/')
            ? `${obj.url}login?code=${obj.token}`
            : `${obj.url}#/login?code=${obj.token}`;
        clipboard.writeSync(formattedUrl);
    }
    /**
     * 复制店铺地址
     * @param obj - 包含url、服务名称和店铺名称的对象
     */
    copyURL(obj: { url: string; serviceName: string; shopName: string }) {
        clipboard.writeSync(obj.url);
        logger.success(`【${obj.serviceName}】已复制店铺【${obj.shopName}】的地址\n${obj.url}`);
    }
    /**
     * 打印用户信息
     * @param obj - 包含token、服务名称、店铺名称和获取用户信息的方法的对象
     * @param test - 是否是测试环境
     */
    async printUserInfo(
        obj: {
            token: string;
            serviceName: string;
            shopName: string;
            getUserInfo: (tk: string, isTest: boolean) => Promise<UserInfo>;
        },
        test: boolean,
    ) {
        logger.info('正在获取用户信息');
        const data = await obj.getUserInfo(obj.token, test);
        logger.success(`获取店铺【${obj.shopName}】信息成功!`);
        console.log(data);
    }
    /**
     * 打开PC端
     * @param obj - 包含url、服务名称和店铺名称的对象
     */
    openPC(obj: { url: string; serviceName: string; shopName: string }) {
        logger.success(`店铺【${obj.shopName}】打开成功!`);
        open(obj.url.replace('app', ''));
    }
    /**
     * 无法使用version搜索
     */
    noVersionSearch(obj: { serviceName: string }) {
        logger.error(`【${obj.serviceName}】无法使用version搜索`);
        process.exit(0);
    }
}
