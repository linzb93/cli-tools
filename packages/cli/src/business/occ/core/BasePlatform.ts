import { Options } from '../types';
export abstract class BasePlatform {
    abstract name: string;
    abstract serviceName: string;
    abstract defaultId: string;
    abstract testDefaultId: string;
    abstract appKey: string;
    isDefault = false;
    /**
     * 获取店铺URL
     */
    abstract getShopUrl(keyword: string, options: Options): Promise<string>;
    /**
     * 获取用户信息
     */
    abstract getUserInfo(token: string, userApi: string, isTest: boolean): Promise<any>;
    /**
     * 自定义操作
     */
    customAction?(keyword: string, options: Options): Promise<void>;
    /**
     * 打开PC端
     * @param url 店铺URL
     * @param shopName 店铺名称
     */
    openPC(url: string, shopName: string): void {
        // window.open(url, '_blank');
    }
    /**
     * 获取token
     */
    getToken(url: string): string {
        if (!url.startsWith('http')) {
            return url;
        }
        const { hash } = new URL(url);
        const params = new URLSearchParams(hash.replace(/^#\/[0-9a-zA-Z]+/, ''));
        const fullToken = params.get('code') || '';
        return fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
    }
    /**
     * 运行操作
     */
    run?(keyword: string, options: Options): Promise<void>;
}
