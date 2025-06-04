export interface Options {
    /**
     * 是否只获取token，默认是打开网页
     */
    token: string | boolean;
    /**
     * 是否打开PC端网页，默认打开的是移动端网页
     */
    pc: boolean;
    /**
     * 是否复制店铺完整地址（含未处理的token）
     */
    copy: boolean;
    /**
     * 是否在获取地址后调用user api获取用户信息
     */
    user: boolean;
    /**
     * 使用日期检索
     */
    date: boolean;
    /**
     * 检索版本
     */
    version: number;
    /**
     * 是否在测试站操作
     */
    test: boolean;
    /**
     * 补齐登录的地址
     */
    fix: string;
    /**
     * 平台名称
     * */
    pt: string;
}

export interface UserInfo {
    version: number;
    versionPlus?: number;
    surplusDays?: number;
}
