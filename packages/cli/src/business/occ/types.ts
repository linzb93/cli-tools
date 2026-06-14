export interface Options {
    /**
     * 是否只获取token，默认是打开网页
     * @default false
     */
    token: string | boolean;
    /**
     * 是否打开PC端网页，默认打开的是移动端网页
     * @default false
     */
    pc: boolean;
    /**
     * 是否复制店铺完整地址（含未处理的token）
     * @default false
     */
    copy: boolean;
    /**
     * 是否在获取地址后调用user api获取用户信息
     * @default false
     */
    user: boolean;
    /**
     * 使用日期检索
     * @default false
     */
    date: boolean;
    /**
     * 检索版本
     */
    version: number;
    /**
     * 是否在测试站操作
     * @default false
     */
    test: boolean;
    /**
     * 补齐登录的地址
     */
    fix: string;
    /**
     * 平台名称
     * */
    platform: string;
    /**
     * 类型，各应用根据需要自定义
     */
    type: string;
    /**
     * 是否选择登录账号
     * @default false
     */
    select: boolean;
}
export interface GetUserInfoRequest {
    token: string;
    userApi: string;
    isTest: boolean;
}
export interface OccSchema {
    oa: {
        apiPrefix: string;
        testPrefix: string;
        username: string;
        password: string;
        token: string;
    };
}
export interface OccImplZdbSchema {
    oa: {
        zdb: {
            origin: string;
        };
    };
}
