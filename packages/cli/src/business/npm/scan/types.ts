/**
 * npm 扫描结果项
 */
export interface ScanResultItem {
    /** 项目路径 */
    fullPath: string;
    /** 项目名称 */
    projectName: string;
    /** 依赖类型 */
    dependencyType: 'dependencies' | 'devDependencies' | null;
    /** package.json 中的版本 */
    currentVersion: string | null;
    /** 是否锁版本（精确版本，无 ^ ~ >= 等前缀） */
    isLocked: boolean;
    /** 问题状态 */
    status: 'problem' | 'found' | 'not-found';
}
