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