/**
 * iteration 命令的类型定义
 */

/**
 * iteration 命令的参数类型
 */
export interface IterationOptions {
    /**
     * 是否为三级修复版本
     */
    fix?: boolean;
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
    /** 当前版本号 */
    currentVersion: string;
    /** 新版本号 */
    newVersion: string;
    /** 最终版本号（可能因分支已存在而改变） */
    finalVersion: string;
    /** 主分支名 */
    mainBranch: string;
    /** 当前分支名 */
    currentBranch: string;
    /** 目标分支名 */
    targetBranch: string;
    /** 是否为 Monorepo */
    isMono: boolean;
    /** 是否为 GitHub 项目 */
    isGithub: boolean;
    /** 是否为修复模式 */
    fix: boolean;
    /** 是否为调试模式 */
    isDebug: boolean;
    /** 是否需要创建分支（仅 GitHub 项目使用） */
    shouldCreateBranch?: boolean;
}