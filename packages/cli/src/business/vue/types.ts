export interface Options {
    command: string;
    /**
     * 是否显示已操作过的任务列表
     * @default false
     */
    list: boolean;
    /**
     * 是否只开启服务，不打包
     * @default false
     */
    server: boolean;
    /**
     * 是否切换分支，打包并启动服务器
     * @default false
     */
    checkout: boolean;
    /**
     * 是否是本地项目
     * @default false
     */
    current: boolean;
    /**
     * 端口号
     * @default 7001
     */
    port: number;
    publicPath: string;
}

/**
 * 项目配置信息
 */
export interface ProjectConfig {
    cwd: string;
    command: string;
    port: number;
    publicPath: string;
    branchName?: string;
}
