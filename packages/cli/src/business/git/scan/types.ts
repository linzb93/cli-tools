export interface Options {
    /**
     * 是否全量扫描
     * @default false
     * */
    full: boolean;
}

export interface ResultItem {
    path: string;
    /**
     * 1. 未提交
     * 2. 未推送
     * 3. 正常
     * 4. 不在主分支上
     * */
    status: number;
    branchName: string;
}

/**
 * 扫描进度回调接口
 */
export interface ScanCallbacks {
    /** 总数确定时调用 */
    onTotal?: (total: number) => void;
    /** 每扫描完成一个项目时调用 */
    onProgress?: (current: number, total: number) => void;
    /** 扫描完成时调用 */
    onComplete?: (list: ResultItem[]) => void;
}