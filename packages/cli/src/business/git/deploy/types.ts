/**
 * Deploy命令选项接口
 */
export interface DeployOptions {
    /**
     * 是否发布到master或main分支
     * @default false
     */
    prod?: boolean;
    /**
     * 项目类型，用于标记tag
     */
    type?: string;
    /**
     * 项目版本号，用于标记tag
     */
    version?: string;
    /**
     * 是否打开对应的jenkins主页
     * @default false
     */
    open?: boolean;
    /**
     * git commit提交信息
     */
    commit: string;
    /**
     * 仅完成基础命令后结束任务
     * @default false
     */
    current?: boolean;
    /**
     * 工作目录路径，不作为命令行选项传入
     * @default process.cwd()
     */
    cwd?: string;
}
