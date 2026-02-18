import type { BranchInfo } from '../shared/utils';

export interface GetOptions {
    /**
     * 是否删除分支
     * @defalut false
     * */
    delete: boolean;
    /**
     * 关键词
     * */
    key: string;
}

export interface BranchExtraItem extends BranchInfo {
    value: string;
}
