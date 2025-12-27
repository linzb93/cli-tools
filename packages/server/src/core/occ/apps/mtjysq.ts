import MeituanBase from './base/meituan';
export default class extends MeituanBase {
    name = 'jysq';
    appKey = '4';
    serviceName = '经营神器-美团';
    defaultId = '15983528161';
    testDefaultId = '15983528161';
    isDefault = true;
    override userApi = 'homeUserInfo';
    openPC(url: string, shopName: string) {
        this.occUtils.openPC({ url, serviceName: this.serviceName, shopName });
    }
    /**
     * 通过版本号获取店铺
     * @param {string} versionName 版本名称
     */
    getShopByVersion(versionName: string) {
        const map = {
            0: '初级版',
            1: '高级版',
            2: '豪华版',
            3: '体验版',
        };
        const versionIdStr = Object.keys(map).find((id) => map[id] === versionName);
        if (!versionIdStr) {
            throw new Error('不存在的版本名称');
        }
        const versionId = Number(versionIdStr);
        if (versionId <= 1) {
            // getMeituanShopList({});
            return;
        }
    }
    /**
     * 获取豪华版店铺
     * 思路：获取高级版前10个店铺，找到支付金额大于199的。调用home接口确认。如果没有，重复获取10个店铺。
     */
    async getLuxuryShop() {
        // const list = await getMeituanOrderList({});
    }
    /**
     * 获取体验版店铺
     * 思路：去那个埋点里面找触发的店铺，每个店铺调用home接口确认。如果没有，就重复。
     */
    async getSurplusShop() {
        // const list = await getTrackUserList({});
    }
}
