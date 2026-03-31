/**
 * 待扫描的Git项目
 */
export interface InputItem {
    /** 项目路径 */
    fullPath: string;
}
export interface ResultItem extends InputItem {
    /**
     * Git项目状态
     * 1. 未提交
     * 2. 未推送
     * 3. 正常
     * 4. 不在主分支上
     * */
    status: number;
    /** 当前分支名称 */
    branchName: string;
}
