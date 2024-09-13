export default abstract class {
  appKey: string;
  /**
   * 名称（缩写）
   */
  abstract name: string;
  /**
   * 应用名称（中文）
   */
  abstract serviceName: string;

  /**
   * （正式站）当没有传入查询ID时，使用的默认ID，一般是测试账号
   */
  abstract defaultId: string;
  /**
   * （测试站）当没有传入查询ID时，使用的默认ID，一般是测试账号
   */
  abstract testDefaultId: string;
  /**
   * 应用是否有PC端
   */
  hasPC = false;
  abstract searchKey: string;

  /**
   * 根据搜索关键词获取店铺地址
   * @param {string} keyword - 搜索关键词
   */
  abstract getShopUrl(keyword: string, isTest: boolean): Promise<string>;
  /**
   * 获取用户信息
   * @param {string} token - 用户token
   */
  async getUserInfo(token: string, isTest: boolean): Promise<string> {
    return token;
  }
}
