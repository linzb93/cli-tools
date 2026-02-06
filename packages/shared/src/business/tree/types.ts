export interface Options {
    /**
     * 遍历的层数，不填为遍历全部
     */
    level: number;
    /**
     * 忽视的目录
     */
    ignore: string;
    /**
     * 是否复制生成的树文本进剪贴板
     */
    copy: boolean;
    /**
     * 是否显示注释，注释以井号开头
     */
    comment: boolean;
}

export interface TreeContext {
    outputList: string[];
    ignoreDirs: string[];
    options: Options;
    maxLineLength: number;
}
