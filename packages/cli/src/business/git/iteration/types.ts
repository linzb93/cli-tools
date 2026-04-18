/**
 * iteration 命令的类型定义
 */

/**
 * iteration 命令的参数类型
 */
export interface IterationOptions {
    /**
     * 可选的指定版本号参数
     */
    version?: string;
}

/**
 * 迭代流程上下文
 */
export interface IterationContext {
    /** 项目路径 */
    projectPath: string;
    /** package.json 路径 */
    pkgPath: string;
    /** 新版本号 */
    newVersion: string;
    /** 当前分支名 */
    currentBranch: string;
    /** 目标分支名 */
    targetBranch: string;
}

export interface IProjectType {
    isMono: boolean;
    isGithub: boolean;
}
