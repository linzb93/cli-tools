export interface Options {
    /**
     * 是否显示已操作过的任务列表供选择
     * @default false
     */
    select: boolean;
    skip: boolean;
}

/**
 * 项目配置信息
 */
export interface ProjectConfig {
    cwd: string;
    publicPath?: string;
}
