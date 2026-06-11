import { Options, GetUserInfoRequest } from '../types';
export abstract class BasePlatform {
    abstract name: string;
    abstract serviceName: string;
    abstract defaultId: string;
    abstract testDefaultId: string;
    abstract appKey: string;
    abstract userApi: string;
    isDefault = false;
    /**
     * 获取店铺URL
     */
    abstract getShopUrl(keyword: string, options: Options): Promise<string>;
    /**
     * 获取应用内用户信息
     */
    abstract getUserInfo(params: GetUserInfoRequest): Promise<any>;
    /**
     * 打开PC端
     * @param url 店铺URL
     * @param shopName 店铺名称
     */
    openPC(url: string, shopName: string): void {
        console.log(url, shopName);
    }
    /**
     * 获取token
     */
    getToken(url: string, tokenKey = 'code'): string {
        if (!url.startsWith('http')) {
            return url;
        }
        const { hash } = new URL(url);
        const params = new URLSearchParams(hash.replace(/^#\/[0-9a-zA-Z]+/, ''));
        const fullToken = params.get(tokenKey) || '';
        return fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
    }
    /**
     * 运行操作
     */
    run?(keyword: string, options: Options): Promise<void>;
}
